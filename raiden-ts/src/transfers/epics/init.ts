import { from, Observable, merge, of, EMPTY, defer } from 'rxjs';
import { filter, mergeMap, pluck, take, mergeMapTo } from 'rxjs/operators';

import { Capabilities } from '../../constants';
import { RaidenAction } from '../../actions';
import { RaidenState } from '../../state';
import { RaidenEpicDeps } from '../../types';
import { matrixPresence } from '../../transport/actions';
import { untime } from '../../utils/types';
import {
  transferExpire,
  transferSigned,
  transferUnlock,
  transferSecretRequest,
  transferSecretReveal,
  transferSecret,
} from '../actions';
import { Direction } from '../state';

/**
 * Re-queue pending transfer's BalanceProof/Envelope messages for retry on init
 *
 * @param action$ - Observable of RaidenActions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.db - Database instance
 * @returns Observable of transferSigned|transferUnlock.success actions
 */
export const initQueuePendingEnvelopeMessagesEpic = (
  {}: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { db }: RaidenEpicDeps,
) =>
  defer(() =>
    from(
      db.transfers
        .chain()
        .find({ direction: Direction.SENT })
        .where(
          (r) =>
            !r.unlockProcessed && !r.expiredProcessed && !r.secretRegistered && !r.channelClosed,
        )
        .data(),
    ),
  ).pipe(
    mergeMap(function* (doc) {
      // loop over all pending transfers
      const meta = { secrethash: doc.transfer.lock.secrethash, direction: Direction.SENT };
      // on init, request monitor presence of any pending transfer target
      yield matrixPresence.request(undefined, { address: doc.transfer.target });
      // Processed not received yet for LockedTransfer
      if (!doc.transferProcessed)
        yield transferSigned(
          {
            message: untime(doc.transfer),
            fee: doc.fee,
            partner: doc.partner,
          },
          meta,
        );
      // already unlocked, but Processed not received yet for Unlock
      if (doc.unlock)
        yield transferUnlock.success({ message: untime(doc.unlock), partner: doc.partner }, meta);
      // lock expired, but Processed not received yet for LockExpired
      if (doc.expired)
        yield transferExpire.success({ message: untime(doc.expired), partner: doc.partner }, meta);
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
 * @returns Observable of transferSigned|transferUnlock.success actions
 */
export const initQueuePendingReceivedEpic = (
  {}: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { db, config$ }: RaidenEpicDeps,
) =>
  defer(() =>
    from(
      db.transfers
        .chain()
        .find({ direction: Direction.RECEIVED })
        .where((r) => !r.unlock && !r.expired && !r.secretRegistered && !r.channelClosed)
        .data(),
    ),
  ).pipe(
    mergeMap((doc) => {
      // loop over all pending transfers
      const secrethash = doc.transfer.lock.secrethash;
      const meta = { secrethash, direction: Direction.RECEIVED };
      return merge(
        // on init, request monitor presence of any pending transfer initiator
        of(
          transferSigned(
            {
              message: untime(doc.transfer),
              fee: doc.fee,
              partner: doc.partner,
            },
            meta,
          ),
        ),
        // already revealed to us, but user didn't sign SecretReveal yet
        doc.secret && !doc.secretReveal ? of(transferSecret({ secret: doc.secret }, meta)) : EMPTY,
        // already revealed to sender, but they didn't Unlock yet
        doc.secretReveal
          ? of(transferSecretReveal({ message: untime(doc.secretReveal) }, meta))
          : EMPTY,
        // secret not yet known; request *when* receiving is enabled (may be later)
        // secretRequest should always be defined as we sign it when receiving transfer
        !doc.secret && doc.secretRequest
          ? config$.pipe(
              pluck('caps', Capabilities.NO_RECEIVE),
              filter((noReceive) => !noReceive),
              take(1),
              mergeMapTo(
                of(
                  matrixPresence.request(undefined, { address: doc.transfer.initiator }),
                  transferSecretRequest({ message: untime(doc.secretRequest) }, meta),
                ),
              ),
            )
          : EMPTY,
      );
    }),
  );
