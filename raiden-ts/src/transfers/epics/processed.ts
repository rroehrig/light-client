import { defer, from, Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

import { RaidenAction } from '../../actions';
import { messageSend } from '../../messages/actions';
import { Processed } from '../../messages/types';
import { getBalanceProofFromEnvelopeMessage, isMessageReceivedOfType } from '../../messages/utils';
import { RaidenState } from '../../state';
import { RaidenEpicDeps } from '../../types';
import { Signed, isntNil } from '../../utils/types';
import { isActionOf } from '../../utils/actions';
import { get$ } from '../../db/utils';
import {
  transfer,
  transferExpireProcessed,
  transferProcessed,
  transferUnlockProcessed,
} from '../actions';
import { Direction } from '../state';
import { transferKey } from '../utils';

/**
 * Handles receiving a signed Processed for some sent LockedTransfer, Unlock or LockExpired
 * This will persist the Processed reply in transfer state and stop message retry
 *
 * @param action$ - Observable of messageReceived actions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.db - Database instance
 * @returns Observable of transfer*Processed|transfer.success actions
 */
export const transferProcessedReceivedEpic = (
  action$: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { db }: RaidenEpicDeps,
): Observable<
  transfer.success | transferProcessed | transferUnlockProcessed | transferExpireProcessed
> =>
  action$.pipe(
    filter(isMessageReceivedOfType(Signed(Processed))),
    mergeMap((action) =>
      defer(() =>
        from(
          db.transfers
            .chain()
            .find({ direction: Direction.SENT, partner: action.meta.address })
            .where(
              (r) =>
                r.transfer.message_identifier.eq(action.payload.message.message_identifier) ||
                !!r.unlock?.message_identifier?.eq?.(action.payload.message.message_identifier) ||
                !!r.expired?.message_identifier?.eq?.(action.payload.message.message_identifier),
            )
            .data(),
        ),
      ).pipe(
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
                balanceProof: getBalanceProofFromEnvelopeMessage(doc.unlock!),
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
      get$(db.transfers, transferKey(action.meta)).pipe(
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
