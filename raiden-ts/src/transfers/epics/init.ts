import { from, Observable, merge, of, EMPTY, defer } from 'rxjs';
import { filter, mergeMap, pluck, take, mergeMapTo } from 'rxjs/operators';

import { Capabilities } from '../../constants';
import { RaidenAction } from '../../actions';
import { RaidenState } from '../../state';
import { RaidenEpicDeps } from '../../types';
import { matrixPresence } from '../../transport/actions';
import { untime, decode } from '../../utils/types';
import { TransferStateish } from '../../db/types';
import {
  transferExpire,
  transferSigned,
  transferUnlock,
  transferSecretRequest,
  transferSecretReveal,
  transferSecret,
} from '../actions';
import { Direction, TransferState } from '../state';

/**
 * Re-queue pending transfer's BalanceProof/Envelope messages for retry on init
 *
 * @param action$ - Observable of RaidenActions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.db - Database instance
 * @param deps.log - Logger instance
 * @returns Observable of transferSigned|transferUnlock.success actions
 */
export const initQueuePendingEnvelopeMessagesEpic = (
  {}: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { log, db }: RaidenEpicDeps,
) =>
  defer(() =>
    db.find({
      selector: {
        direction: Direction.SENT,
        unlockProcessed: { $exists: false },
        expiredProcessed: { $exists: false },
        secretRegistered: { $exists: false },
        channelClosed: { $exists: false },
      },
    }),
  ).pipe(
    mergeMap(({ docs, warning }) => {
      if (warning) log.warn(warning, 'initQueuePendingEnvelopeMessagesEpic');
      return from(docs as TransferStateish[]);
    }),
    mergeMap(function* (doc) {
      // loop over all pending transfers
      const transferState = decode(TransferState, doc);
      const meta = { secrethash: doc.transfer.lock.secrethash, direction: Direction.SENT };
      // on init, request monitor presence of any pending transfer target
      yield matrixPresence.request(undefined, { address: transferState.transfer.target });
      // Processed not received yet for LockedTransfer
      if (!transferState.transferProcessed)
        yield transferSigned(
          {
            message: untime(transferState.transfer),
            fee: transferState.fee,
            partner: transferState.partner,
          },
          meta,
        );
      // already unlocked, but Processed not received yet for Unlock
      if (transferState.unlock)
        yield transferUnlock.success(
          { message: untime(transferState.unlock), partner: transferState.partner },
          meta,
        );
      // lock expired, but Processed not received yet for LockExpired
      if (transferState.expired)
        yield transferExpire.success(
          { message: untime(transferState.expired), partner: transferState.partner },
          meta,
        );
    }),
  );

/**
 * Re-queue pending Received transfer's
 *
 * @param action$ - Observable of RaidenActions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.config$ - Config observable
 * @param deps.db - Database instance
 * @param deps.log - Logger instance
 * @returns Observable of transferSigned|transferUnlock.success actions
 */
export const initQueuePendingReceivedEpic = (
  {}: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { log, db, config$ }: RaidenEpicDeps,
) =>
  defer(() =>
    db.find({
      selector: {
        direction: Direction.RECEIVED,
        unlock: { $exists: false },
        expired: { $exists: false },
        secretRegistered: { $exists: false },
        channelClosed: { $exists: false },
      },
    }),
  ).pipe(
    mergeMap(({ docs, warning }) => {
      if (warning) log.warn(warning, 'initQueuePendingReceivedEpic');
      return from(docs as TransferStateish[]);
    }),
    mergeMap((doc) => {
      // loop over all pending transfers
      const secrethash = doc.transfer.lock.secrethash;
      const transferState = decode(TransferState, doc);
      const meta = { secrethash, direction: Direction.RECEIVED };
      return merge(
        // on init, request monitor presence of any pending transfer initiator
        of(
          transferSigned(
            {
              message: untime(transferState.transfer),
              fee: transferState.fee,
              partner: transferState.partner,
            },
            meta,
          ),
        ),
        // already revealed to us, but user didn't sign SecretReveal yet
        transferState.secret && !transferState.secretReveal
          ? of(transferSecret({ secret: transferState.secret }, meta))
          : EMPTY,
        // already revealed to sender, but they didn't Unlock yet
        transferState.secretReveal
          ? of(transferSecretReveal({ message: untime(transferState.secretReveal) }, meta))
          : EMPTY,
        // secret not yet known; request *when* receiving is enabled (may be later)
        // secretRequest should always be defined as we sign it when receiving transfer
        !transferState.secret && transferState.secretRequest
          ? config$.pipe(
              pluck('caps', Capabilities.NO_RECEIVE),
              filter((noReceive) => !noReceive),
              take(1),
              mergeMapTo(
                of(
                  matrixPresence.request(undefined, { address: transferState.transfer.initiator }),
                  transferSecretRequest({ message: untime(transferState.secretRequest) }, meta),
                ),
              ),
            )
          : EMPTY,
      );
    }),
  );
