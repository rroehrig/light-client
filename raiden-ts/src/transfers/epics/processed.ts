import { defer, from, Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

import { RaidenAction } from '../../actions';
import { messageSend } from '../../messages/actions';
import { Processed } from '../../messages/types';
import { getBalanceProofFromEnvelopeMessage, isMessageReceivedOfType } from '../../messages/utils';
import { RaidenState } from '../../state';
import { RaidenEpicDeps } from '../../types';
import { Signed, isntNil, decode } from '../../utils/types';
import { isActionOf } from '../../utils/actions';
import { TransferStateish } from '../../db/types';
import { get$ } from '../../db/utils';
import {
  transfer,
  transferExpireProcessed,
  transferProcessed,
  transferUnlockProcessed,
} from '../actions';
import { Direction, TransferState } from '../state';
import { transferKey } from '../utils';

/**
 * Handles receiving a signed Processed for some sent LockedTransfer, Unlock or LockExpired
 * This will persist the Processed reply in transfer state and stop message retry
 *
 * @param action$ - Observable of messageReceived actions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.db - Database instance
 * @param deps.log - Logger instance
 * @returns Observable of transfer*Processed|transfer.success actions
 */
export const transferProcessedReceivedEpic = (
  action$: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { log, db }: RaidenEpicDeps,
): Observable<
  transfer.success | transferProcessed | transferUnlockProcessed | transferExpireProcessed
> =>
  action$.pipe(
    filter(isMessageReceivedOfType(Signed(Processed))),
    mergeMap((action) =>
      defer(async () => {
        const hex = action.payload.message.message_identifier.toHexString();
        return db.find({
          selector: {
            direction: Direction.SENT,
            partner: action.meta.address,
            $or: [
              { 'transfer.message_identifier._hex': hex },
              { 'unlock.message_identifier._hex': hex },
              { 'expired.message_identifier._hex': hex },
            ],
          },
        });
      }).pipe(
        mergeMap((result) => {
          if (result.warning) log.warn(result.warning, action);
          return from(result.docs as TransferStateish[]);
        }),
        mergeMap(function* (doc) {
          const meta = { secrethash: doc.secrethash, direction: Direction.SENT };
          if (action.payload.message.message_identifier.eq(doc.transfer.message_identifier)) {
            yield transferProcessed({ message: action.payload.message }, meta);
          } else if (
            action.payload.message.message_identifier.eq(doc.unlock?.message_identifier ?? 0)
          ) {
            // Unlock's Processed also notifies whole transfer as success
            yield transfer.success(
              {
                balanceProof: getBalanceProofFromEnvelopeMessage(
                  decode(TransferState, doc).unlock!,
                ),
              },
              meta,
            );
            yield transferUnlockProcessed({ message: action.payload.message }, meta);
          } else if (
            action.payload.message.message_identifier.eq(doc.expired?.message_identifier ?? 0)
          ) {
            yield transferExpireProcessed({ message: action.payload.message }, meta);
          }
        }),
      ),
    ),
  );

/**
 * Handles sending Processed for a received EnvelopeMessages
 *
 * @param action$ - Observable of transferProcessed actions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.db - Database instance
 * @returns Observable of messageSend.request actions
 */
export const transferProcessedSendEpic = (
  action$: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { db }: RaidenEpicDeps,
): Observable<messageSend.request> =>
  action$.pipe(
    filter(isActionOf([transferProcessed, transferUnlockProcessed, transferExpireProcessed])),
    // transfer direction is RECEIVED, not message direction (which is outbound)
    filter((action) => action.meta.direction === Direction.RECEIVED),
    mergeMap((action) =>
      get$<TransferStateish>(db, transferKey(action.meta)).pipe(
        filter(isntNil),
        map((doc) =>
          messageSend.request(
            { message: action.payload.message },
            {
              address: doc.partner,
              msgId: action.payload.message.message_identifier.toString(),
            },
          ),
        ),
      ),
    ),
  );
