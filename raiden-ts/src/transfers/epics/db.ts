import { Observable } from 'rxjs';
import { filter, ignoreElements, withLatestFrom, tap } from 'rxjs/operators';
import pick from 'lodash/fp/pick';

import { RaidenAction } from '../../actions';
import { RaidenState } from '../../state';
import { RaidenEpicDeps } from '../../types';
import { isActionOf } from '../../utils/actions';
import { timed } from '../../utils/types';
import { channelKey, channelUniqueKey } from '../../channels/utils';
import { ChannelState } from '../../channels/state';
import { channelClose, channelSettle } from '../../channels/actions';
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
  { db }: RaidenEpicDeps,
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
    tap(([action]) =>
      // insert will fail if there's already a transfer with 'key'
      db.transfers.insert({
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
      }),
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
    tap(([action]) => {
      const field = transferUnlock.success.is(action) ? 'unlock' : 'expired';
      const doc = db.transfers.by('_id', transferKey(action.meta));
      if (!doc || doc[field]) return;
      db.transfers.update({ ...doc, [field]: timed(action.payload.message) });
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
    tap((action) => {
      const doc = db.transfers.by('_id', transferKey(action.meta));
      if (!doc) return;
      // unconfirmed transferSecretRegister is handled as transferSecret:
      // acknowledge secret, but don't set it as registered yet
      if (transferSecret.is(action) || action.payload.confirmed === undefined) {
        if (doc.secret) return; // only update if secret is unset
      } else {
        // update if secret is unset or registerBlock needs update
        if (doc.secret && doc.secretRegistered?.txBlock === action.payload.txBlock) return;
      }
      db.transfers.update({
        ...doc,
        secret: action.payload.secret,
        ...(transferSecret.is(action) || action.payload.confirmed === undefined
          ? {}
          : { secretRegistered: timed(pick(['txHash', 'txBlock'], action.payload)) }),
      });
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
    tap((action) => {
      const field = fieldMap[action.type];
      const doc = db.transfers.by('_id', transferKey(action.meta));
      if (!doc || (!transferSecretRequest.is(action) && doc[field])) return;
      db.transfers.update({ ...doc, [field]: timed(action.payload.message) });
    }),
    ignoreElements(),
  );

export const transferChannelClosedReducerEpic = (
  action$: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { db }: RaidenEpicDeps,
): Observable<never> =>
  action$.pipe(
    filter(isActionOf([channelClose.success, channelSettle.success])),
    filter((action) => !!action.payload.confirmed),
    tap((action) => {
      const field = channelClose.success.is(action) ? 'channelClosed' : 'channelSettled';
      const results = db.transfers.find({
        channel: channelUniqueKey({ id: action.payload.id, ...action.meta }),
      });
      for (const doc of results) {
        db.transfers.update({
          ...doc,
          [field]: timed(pick(['txHash', 'txBlock'], action.payload)),
        });
      }
    }),
    ignoreElements(),
  );
