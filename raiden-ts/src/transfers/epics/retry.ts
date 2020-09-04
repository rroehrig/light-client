/* eslint-disable @typescript-eslint/no-explicit-any */
import { EMPTY, Observable } from 'rxjs';
import { filter, mergeMap, withLatestFrom, switchMap, first } from 'rxjs/operators';

import { RaidenAction } from '../../actions';
import { messageSend } from '../../messages/actions';
import { RaidenState } from '../../state';
import { RaidenEpicDeps } from '../../types';
import { isActionOf } from '../../utils/actions';
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
 * Handles a transferSigned action and retry messageSend.request until transfer is gone (completed
 * with success or error) OR Processed message for LockedTransfer received.
 * transferSigned for pending LockedTransfer's may be re-emitted on startup for pending transfer,
 * to start retrying sending the message again until stop condition is met.
 *
 * @param action$ - Observable of transferSigned actions
 * @param action - The {@link transferSigned} action
 * @param deps - Epics dependencies subset
 * @param deps.config$ - Observable of latest RaidenConfig
 * @param deps.db - Database instance
 * @returns - Observable of {@link messageSend.request} actions
 */
const signedRetryMessage$ = (
  action$: Observable<RaidenAction>,
  action: transferSigned,
  { db, config$ }: Pick<RaidenEpicDeps, 'db' | 'config$'>,
): Observable<messageSend.request> => {
  if (action.meta.direction !== Direction.SENT) return EMPTY;
  return config$.pipe(
    first(),
    switchMap(({ pollingInterval, httpTimeout }) => {
      const signed = action.payload.message;
      const send = messageSend.request(
        { message: signed },
        { address: signed.recipient, msgId: signed.message_identifier.toString() },
      );
      const notifier = get$(db.transfers, transferKey(action.meta)).pipe(
        filter(
          (doc) =>
            !!(
              doc.transferProcessed ||
              doc.unlockProcessed ||
              doc.expiredProcessed ||
              doc.channelClosed
            ),
        ),
      );
      // emit request once immediatelly, then wait until success, then retry every 30s
      return retrySendUntil$(
        send,
        action$,
        notifier,
        exponentialBackoff(pollingInterval, httpTimeout * 2),
      );
    }),
  );
};

/**
 * Handles a transferUnlock.success action and retry messageSend until confirmed.
 * transferUnlock.success for pending Unlock's may be re-emitted on startup for pending transfer, to
 * start retrying sending the message again until stop condition is met.
 *
 * @param action$ - Observable of transferUnlock.success actions
 * @param action - the transferUnlock.success action
 * @param deps - Epics dependencies subset
 * @param deps.config$ - Observable of latest RaidenConfig
 * @param deps.db - Database instance
 * @returns Observable of {@link messageSend.request} actions
 */
const unlockedRetryMessage$ = (
  action$: Observable<RaidenAction>,
  action: transferUnlock.success,
  { db, config$ }: Pick<RaidenEpicDeps, 'db' | 'config$'>,
): Observable<messageSend.request> => {
  if (action.meta.direction !== Direction.SENT) return EMPTY;
  const doc$ = get$(db.transfers, transferKey(action.meta));
  return doc$.pipe(
    first(),
    withLatestFrom(config$),
    switchMap(([doc, { pollingInterval, httpTimeout }]) => {
      const unlock = action.payload.message;
      const send = messageSend.request(
        { message: unlock },
        { address: doc.partner, msgId: unlock.message_identifier.toString() },
      );
      const notifier = doc$.pipe(filter((doc) => !!(doc.unlockProcessed || doc.channelClosed)));
      // emit request once immediatelly, then wait until respective success,
      // then repeats until confirmed
      return retrySendUntil$(
        send,
        action$,
        notifier,
        exponentialBackoff(pollingInterval, httpTimeout * 2),
      );
    }),
  );
};

/**
 * Handles a transferExpire.success action and retry messageSend.request until transfer is gone (completed
 * with success or error).
 * transferExpire.success for pending LockExpired's may be re-emitted on startup for pending transfer, to
 * start retrying sending the message again until stop condition is met.
 *
 * @param action$ - Observable of transferUnlock.success actions
 * @param action - transferExpire.success action
 * @param deps - Epics dependencies subset
 * @param deps.config$ - Observable of latest RaidenConfig
 * @param deps.db - Database instance
 * @returns Observable of {@link messageSend.request} actions
 */
const expiredRetryMessages$ = (
  action$: Observable<RaidenAction>,
  action: transferExpire.success,
  { db, config$ }: Pick<RaidenEpicDeps, 'db' | 'config$'>,
): Observable<messageSend.request> => {
  if (action.meta.direction !== Direction.SENT) return EMPTY;
  const doc$ = get$(db.transfers, transferKey(action.meta));
  return doc$.pipe(
    first(),
    withLatestFrom(config$),
    switchMap(([doc, { pollingInterval, httpTimeout }]) => {
      const expired = action.payload.message;
      const send = messageSend.request(
        { message: expired },
        {
          address: doc.partner,
          msgId: expired.message_identifier.toString(),
        },
      );
      const notifier = doc$.pipe(filter((doc) => !!(doc.expiredProcessed || doc.channelClosed)));
      // emit request once immediatelly, then wait until respective success,
      // then retries until confirmed
      return retrySendUntil$(
        send,
        action$,
        notifier,
        exponentialBackoff(pollingInterval, httpTimeout * 2),
      );
    }),
  );
};

const secretRequestRetryMessage$ = (
  action$: Observable<RaidenAction>,
  action: transferSecretRequest,
  { db, config$ }: Pick<RaidenEpicDeps, 'db' | 'config$'>,
): Observable<messageSend.request> => {
  if (action.meta.direction !== Direction.RECEIVED) return EMPTY;
  const doc$ = get$(db.transfers, transferKey(action.meta));
  return doc$.pipe(
    first(),
    withLatestFrom(config$),
    switchMap(([doc, { pollingInterval, httpTimeout }]) => {
      const request = action.payload.message;
      const send = messageSend.request(
        { message: request },
        {
          address: doc.transfer.initiator,
          msgId: request.message_identifier.toString(),
        },
      );
      // stop retrying when we've signed secretReveal, lock expired or channel closed;
      // we could stop as soon as we know received.secret, but we use it to retry SecretReveal
      // signature, if it failed for any reason
      const notifier = doc$.pipe(
        filter((doc) => !!(doc.secretReveal || doc.expired || doc.channelClosed)),
      );
      // emit request once immediatelly, then wait until respective success,
      // then retries until confirmed
      return retrySendUntil$(
        send,
        action$,
        notifier,
        exponentialBackoff(pollingInterval, httpTimeout * 2),
      );
    }),
  );
};

const secretRevealRetryMessage$ = (
  action$: Observable<RaidenAction>,
  action: transferSecretReveal,
  { db, config$ }: Pick<RaidenEpicDeps, 'db' | 'config$'>,
): Observable<messageSend.request> => {
  if (action.meta.direction !== Direction.RECEIVED) return EMPTY;
  const doc$ = get$(db.transfers, transferKey(action.meta));
  return doc$.pipe(
    first(),
    withLatestFrom(config$),
    switchMap(([doc, { pollingInterval, httpTimeout }]) => {
      const reveal = action.payload.message;
      const send = messageSend.request(
        { message: reveal },
        {
          address: doc.partner,
          msgId: reveal.message_identifier.toString(),
        },
      );
      // stop retrying when we were unlocked, secret registered or channel closed
      // we don't test for expired, as we know the secret and must not accept LockExpired
      const notifier = doc$.pipe(
        filter((doc) => !!(doc.unlock || doc.secretRegistered || doc.channelClosed)),
      );
      // emit request once immediatelly, then wait until respective success,
      // then retries until confirmed
      return retrySendUntil$(
        send,
        action$,
        notifier,
        exponentialBackoff(pollingInterval, httpTimeout * 2),
      );
    }),
  );
};

/**
 * Retry sending balance proof messages until their respective Processed
 *
 * @param action$ - Observable of transferExpire.success actions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.latest$ - Latest observable
 * @param deps.config$ - Config observable
 * @returns Observable of messageSend.request actions
 */
export const transferRetryMessageEpic = (
  action$: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  deps: RaidenEpicDeps,
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
    mergeMap((action) =>
      transferSigned.is(action)
        ? signedRetryMessage$(action$, action, deps)
        : transferUnlock.success.is(action)
        ? unlockedRetryMessage$(action$, action, deps)
        : transferExpire.success.is(action)
        ? expiredRetryMessages$(action$, action, deps)
        : transferSecretRequest.is(action)
        ? secretRequestRetryMessage$(action$, action, deps)
        : secretRevealRetryMessage$(action$, action, deps),
    ),
  );
};
