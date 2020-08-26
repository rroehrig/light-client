import { Observable, defer, from } from 'rxjs';
import { filter, ignoreElements, mergeMap, withLatestFrom, first } from 'rxjs/operators';
import pick from 'lodash/fp/pick';

import { RaidenAction } from '../../actions';
import { RaidenState } from '../../state';
import { RaidenEpicDeps } from '../../types';
import { isActionOf } from '../../utils/actions';
import { timed } from '../../utils/types';
import { channelKey, channelUniqueKey } from '../../channels/utils';
import { ChannelState } from '../../channels/state';
import { channelClose } from '../../channels/actions';
import { get$, upSet$ } from '../../db/utils';
import {
  transferSecret,
  transferSecretRegister,
  transferSigned,
  transferUnlock,
  transferExpire,
  transferSecretRequest,
  transferSecretReveal,
  transferProcessed,
  transferUnlockProcessed,
  transferExpireProcessed,
} from '../actions';
import { transferKey } from '../utils';
import { TransferState, Direction } from '../state';
import { TransferStateish } from '../../db/types';

const END = { [Direction.SENT]: 'own', [Direction.RECEIVED]: 'partner' } as const;

function channelKeyFromTransfer(
  transfer: TransferState | transferSigned | transferUnlock.success | transferExpire.success,
) {
  let tokenNetwork, partner;
  if ('type' in transfer) {
    tokenNetwork = transfer.payload.message.token_network_address;
    partner = transfer.payload.partner;
  } else {
    tokenNetwork = transfer.transfer.token_network_address;
    partner = transfer.partner;
  }
  return channelKey({ tokenNetwork, partner });
}

export const transferSignedReducerEpic = (
  action$: Observable<RaidenAction>,
  state$: Observable<RaidenState>,
  { log, db }: RaidenEpicDeps,
): Observable<never> =>
  action$.pipe(
    filter(transferSigned.is),
    withLatestFrom(state$),
    // only proceed if channel is open and nonce is current
    filter(([action, state]) => {
      const channel = state.channels[channelKeyFromTransfer(action)];
      return (
        channel?.state === ChannelState.open &&
        // here, action was already handled by reducer; if it fails, this is an old action, ignore
        channel[END[action.meta.direction]].balanceProof.nonce.eq(action.payload.message.nonce)
      );
    }),
    mergeMap(([action]) =>
      // insert will fail if there's already a transfer with 'key'
      db
        .put({
          _id: transferKey(action.meta),
          channel: channelUniqueKey({
            id: action.payload.message.channel_identifier.toNumber(),
            tokenNetwork: action.payload.message.token_network_address,
            partner: action.payload.partner,
          }),
          ...action.meta, // direction, secrethash
          expiration: action.payload.message.lock.expiration.toNumber(),
          transfer: timed(action.payload.message),
          partner: action.payload.partner,
          fee: action.payload.fee,
        })
        .catch((err) =>
          log.info('db transfer insert failed, possible secrethash conflict, ignoring', err),
        ),
    ),
    ignoreElements(),
  );

export const transferCompletedReducerEpic = (
  action$: Observable<RaidenAction>,
  state$: Observable<RaidenState>,
  { db }: RaidenEpicDeps,
): Observable<never> =>
  action$.pipe(
    filter(isActionOf([transferUnlock.success, transferExpire.success])),
    withLatestFrom(state$),
    // only proceed if channel is open and nonce is current
    filter(([action, state]) => {
      const channel = state.channels[channelKeyFromTransfer(action)];
      return (
        channel?.state === ChannelState.open &&
        // here, action was already handled by reducer; if it fails, this is an old action, ignore
        channel[END[action.meta.direction]].balanceProof.nonce.eq(action.payload.message.nonce)
      );
    }),
    mergeMap(([action]) => {
      const field = transferUnlock.success.is(action) ? 'unlock' : 'expired';
      // db updates should not throw, let's leave this without a catch for a while to check
      return get$<TransferStateish>(db, transferKey(action.meta)).pipe(
        first(),
        filter((doc) => !doc[field]), // if [field] is already set, filter out and complete
        mergeMap((doc) => upSet$(db, doc, { [field]: timed(action.payload.message) })),
      );
    }),
    ignoreElements(),
  );

export const transferSecretReducerEpic = (
  action$: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { db }: RaidenEpicDeps,
): Observable<never> =>
  action$.pipe(
    filter(isActionOf([transferSecret, transferSecretRegister.success])),
    mergeMap((action) => {
      // unconfirmed transferSecretRegister is handled as transferSecret:
      // acknowledge secret, but don't set it as registered yet
      return get$<TransferStateish>(db, transferKey(action.meta)).pipe(
        first(),
        // for SecretRequests, support updating even if the field is already set
        filter((doc) => {
          if (transferSecret.is(action) || action.payload.confirmed === undefined) {
            return !doc.secret; // only update if secret is unset
          } else {
            // update if secret is unset or registerBlock needs update
            return !doc.secret || doc.secretRegistered?.txBlock !== action.payload.txBlock;
          }
        }),
        mergeMap((doc) =>
          upSet$(db, doc, {
            secret: action.payload.secret,
            ...(transferSecret.is(action) || action.payload.confirmed === undefined
              ? {}
              : { secretRegistered: timed(pick(['txHash', 'txBlock'], action.payload)) }),
          }),
        ),
      );
    }),
    ignoreElements(),
  );

const fieldMap = {
  [transferSecretRequest.type]: 'secretRequest',
  [transferSecretReveal.type]: 'secretReveal',
  [transferProcessed.type]: 'transferProcessed',
  [transferUnlockProcessed.type]: 'unlockProcessed',
  [transferExpireProcessed.type]: 'expiredProcessed',
} as const;

export const transferMessagesReducerEpic = (
  action$: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { db }: RaidenEpicDeps,
): Observable<never> =>
  action$.pipe(
    filter(
      isActionOf([
        transferSecretRequest,
        transferSecretReveal,
        transferProcessed,
        transferUnlockProcessed,
        transferExpireProcessed,
      ]),
    ),
    mergeMap((action) => {
      const field = fieldMap[action.type];
      return get$<TransferStateish>(db, transferKey(action.meta)).pipe(
        first(),
        // for SecretRequests, support updating even if the field is already set
        filter((doc) => transferSecretRequest.is(action) || !doc[field]),
        mergeMap((doc) => upSet$(db, doc, { [field]: timed(action.payload.message) })),
      );
    }),
    ignoreElements(),
  );

export const transferChannelClosedReducerEpic = (
  action$: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { log, db }: RaidenEpicDeps,
): Observable<never> =>
  action$.pipe(
    filter(channelClose.success.is),
    filter((action) => !!action.payload.confirmed),
    mergeMap(async (action) => {
      return defer(() =>
        db.find({
          selector: { channel: channelUniqueKey({ id: action.payload.id, ...action.meta }) },
        }),
      ).pipe(
        mergeMap(({ docs, warning }) => {
          if (warning) log.warn(warning, action);
          return from(docs);
        }),
        mergeMap((doc) =>
          upSet$(db, doc, { channelClosed: timed(pick(['txHash', 'txBlock'], action.payload)) }),
        ),
      );
    }),
    ignoreElements(),
  );
