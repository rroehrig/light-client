import { from, merge, Observable, of } from 'rxjs';
import { exhaustMap, filter, withLatestFrom, mergeMap } from 'rxjs/operators';

import { RaidenAction } from '../../actions';
import { newBlock } from '../../channels/actions';
import { RaidenConfig } from '../../config';
import { RaidenState } from '../../state';
import { RaidenEpicDeps } from '../../types';
import { isActionOf, isResponseOf } from '../../utils/actions';
import { RaidenError, ErrorCodes } from '../../utils/error';
import { Hash } from '../../utils/types';
import { transfer, transferExpire } from '../actions';
import { Direction, TransferState } from '../state';
import { dispatchAndWait$ } from './utils';

/**
 * Predicate to check if a transfer has expired.
 *
 * For a transfer to expire it has to satisfy these conditions:
 *
 * - It must *not* have been unlocked.
 * - It must *not* have been expired before.
 * - The corresponding secret must not have been registered on-chain before the
 *   lock's expiration.
 * - The channel must *not* be closed.
 *
 * @param transfer - TransferState to be checked
 * @param confirmationBlocks - Confirmation blocks config param
 * @param blockNumber - The current block number
 * @returns boolean if the transfer has expired
 */
function isTransferExpired(
  transfer: TransferState,
  confirmationBlocks: number,
  blockNumber: number,
): boolean {
  return (
    !transfer.unlock &&
    !transfer.lockExpired &&
    !transfer.channelClosed &&
    transfer.transfer.lock.expiration.add(confirmationBlocks).lte(blockNumber) &&
    // don't expire if secret got registered before lock expired
    !transfer.secret?.registerBlock
  );
}

/**
 * Contains the core logic of {@link transferAutoExpireEpic}.
 *
 * @param action$ - Observable of {@link RaidenAction} actions
 * @param state - Contains The current state of the app
 * @param config - Contains the current app config
 * @param config.confirmationBlocks - Confirmation blocks config param
 * @param blockNumber - The current block number
 * @returns Observable of {@link transferExpire.request} or {@link transfer.failure} actions
 */
function autoExpire$(
  action$: Observable<RaidenAction>,
  state: RaidenState,
  { confirmationBlocks }: RaidenConfig,
  blockNumber: number,
): Observable<transferExpire.request | transfer.failure> {
  // we can send LockExpired only for SENT transfers
  return from(Object.entries(state.sent) as Array<[Hash, typeof state.sent[string]]>).pipe(
    filter(([, sent]) => isTransferExpired(sent, confirmationBlocks, blockNumber)),
    mergeMap(([secrethash, sent]) => {
      const meta = { secrethash, direction: Direction.SENT };
      // this observable acts like a Promise: emits request once, completes on success/failure
      return merge(
        dispatchAndWait$(
          action$,
          transferExpire.request(undefined, meta),
          isResponseOf(transferExpire, meta),
        ),
        // notify users that this transfer failed definitely
        of(
          transfer.failure(
            new RaidenError(ErrorCodes.XFER_EXPIRED, {
              block: sent.transfer.lock.expiration.toString(),
            }),
            meta,
          ),
        ),
      );
    }),
  );
}

/**
 * Process newBlocks, emits transferExpire.request (request to compose&sign LockExpired for a transfer)
 * if pending transfer's lock expired and transfer didn't unlock (succeed) in time
 * Also, emits transfer.failure, to notify users that a transfer has failed (although it'll only be
 * considered as completed with fail once the transferExpireProcessed arrives).
 *
 * @param action$ - Observable of newBlock|transferExpire.success|transferExpire.failure actions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.config$ - Config observable
 * @returns Observable of transferExpire.request|transfer.failure actions
 */
export const transferAutoExpireEpic = (
  action$: Observable<RaidenAction>,
  state$: Observable<RaidenState>,
  { config$ }: RaidenEpicDeps,
): Observable<transferExpire.request | transfer.failure> =>
  action$.pipe(
    filter(isActionOf(newBlock)),
    withLatestFrom(state$, config$),
    // With interactive signing sending a lock expired message requires user
    // intervention. In that case it is possible for a new block to arrive
    // while waiting for the user permission, without the `exhaustMap` below
    // multiple signing requests would be emited *for the same lock*.
    // `exhaustMap` prevents that from happening, by blocking new signing
    // requests until the existing ones have been concluded.
    exhaustMap(([{ payload: { blockNumber } }, state, config]) =>
      autoExpire$(action$, state, config, blockNumber),
    ),
  );
