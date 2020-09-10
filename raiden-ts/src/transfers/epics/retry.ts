/* eslint-disable @typescript-eslint/no-explicit-any */
import { combineLatest, EMPTY, Observable } from 'rxjs';
import { filter, mergeMap, withLatestFrom } from 'rxjs/operators';

import { RaidenAction } from '../../actions';
import { messageSend } from '../../messages/actions';
import { RaidenState } from '../../state';
import { RaidenEpicDeps } from '../../types';
import { isActionOf } from '../../utils/actions';
import { Address } from '../../utils/types';
import { get$ } from '../../db/utils';
import {
  transferExpire,
  transferSigned,
  transferUnlock,
  transferSecretRequest,
  transferSecretReveal,
} from '../actions';
import { Direction } from '../state';
import { transferKey } from '../utils';
import { retrySendUntil$, exponentialBackoff } from './utils';

/**
 * Retry sending protocol messages until stop conditions are met.
 *
 * @param action$ - Observable of transferExpire.success actions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.db - Database instance
 * @param deps.config$ - Config observable
 * @returns Observable of messageSend.request actions
 */
export const transferRetryMessageEpic = (
  action$: Observable<RaidenAction>,
  state$: Observable<RaidenState>,
  { db, config$ }: RaidenEpicDeps,
): Observable<messageSend.request> => {
  return action$.pipe(
    filter(
      isActionOf([
        transferSigned,
        transferUnlock.success,
        transferExpire.success,
        transferSecretRequest,
        transferSecretReveal,
      ]),
    ),
    withLatestFrom(config$),
    mergeMap(([action, { pollingInterval, httpTimeout, revealTimeout }]) => {
      const doc = db.transfers.by('_id', transferKey(action.meta));
      const doc$ = get$(db.transfers, transferKey(action.meta));

      let to: Address | undefined;
      let stop$: Observable<any> | undefined;
      switch (action.type) {
        case transferSigned.type:
          if (action.meta.direction === Direction.SENT) {
            to = action.payload.partner;
            stop$ = doc$.pipe(
              filter(
                (doc) =>
                  !!(
                    doc.transferProcessed ||
                    doc.unlockProcessed || // unlock|expired shouldn't happen before transferProcessed
                    doc.expiredProcessed ||
                    doc.channelClosed
                  ),
              ),
            );
          }
          break;
        case transferUnlock.success.type:
          if (action.meta.direction === Direction.SENT) {
            to = action.payload.partner;
            stop$ = doc$.pipe(filter((doc) => !!(doc.unlockProcessed || doc.channelClosed)));
          }
          break;
        case transferExpire.success.type:
          if (action.meta.direction === Direction.SENT) {
            to = action.payload.partner;
            stop$ = doc$.pipe(filter((doc) => !!(doc.expiredProcessed || doc.channelClosed)));
          }
          break;
        case transferSecretRequest.type:
          if (action.meta.direction === Direction.RECEIVED && doc) {
            to = doc.transfer.initiator;
            stop$ = combineLatest([state$, doc$]).pipe(
              filter(
                ([{ blockNumber }, doc]) =>
                  /* doc.secret would be enough, but let's test secretReveal to possibly retry
                   * failed RevealSecret sign prompts */
                  !!(doc.secretReveal || doc.channelClosed) ||
                  // or when we get inside the danger zone
                  blockNumber > doc.expiration - revealTimeout,
              ),
            );
          }
          break;
        case transferSecretReveal.type:
          if (action.meta.direction === Direction.RECEIVED && doc) {
            to = doc.partner;
            stop$ = doc$.pipe(filter((doc) => !!(doc.unlock || doc.channelClosed)));
          }
          break;
      }

      if (!to || !stop$) return EMPTY;

      return retrySendUntil$(
        messageSend.request(
          { message: action.payload.message },
          { address: to, msgId: action.payload.message.message_identifier.toString() },
        ),
        action$,
        stop$,
        exponentialBackoff(pollingInterval, httpTimeout * 2),
      );
    }),
  );
};
