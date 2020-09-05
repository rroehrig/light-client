import pick from 'lodash/fp/pick';

import type { RaidenPersister } from '../persister';
import { channelKey, channelUniqueKey } from '../channels/utils';
import { ChannelState } from '../channels/state';
import { channelClose, channelSettle } from '../channels/actions';
import { timed } from '../utils/types';
import { isActionOf } from '../utils/actions';
import { transferKey } from './utils';
import { TransferState, Direction } from './state';
import {
  transferSigned,
  transferUnlock,
  transferExpire,
  transferSecret,
  transferSecretRegister,
  transferSecretRequest,
  transferSecretReveal,
  transferProcessed,
  transferUnlockProcessed,
  transferExpireProcessed,
} from './actions';

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

const transferSignedPersister: RaidenPersister = (db, [state], action) => {
  if (!transferSigned.is(action)) return;
  const channel = state.channels[channelKeyFromTransfer(action)];
  const _id = transferKey(action.meta);
  // only proceed if channel is open and nonce is current
  if (
    channel?.state !== ChannelState.open ||
    // here, action was already handled by reducer; if it fails, this is an old action, ignore
    !channel[END[action.meta.direction]].balanceProof.nonce.eq(action.payload.message.nonce) ||
    db.storageKeys.has(_id)
  )
    return;
  db.storageKeys.add(_id);
  db.transfers.insert({
    _id,
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
  });
};

const transferUnlockExpirePersister: RaidenPersister = (db, [state], action) => {
  if (!isActionOf([transferUnlock.success, transferExpire.success], action)) return;
  const channel = state.channels[channelKeyFromTransfer(action)];
  // only proceed if channel is open and nonce is current
  if (
    channel?.state !== ChannelState.open ||
    // here, action was already handled by reducer; if it fails, this is an old action, ignore
    !channel[END[action.meta.direction]].balanceProof.nonce.eq(action.payload.message.nonce)
  )
    return;
  const field = transferUnlock.success.is(action) ? 'unlock' : 'expired';
  const doc = db.transfers.by('_id', transferKey(action.meta));
  if (!doc || doc[field]) return;
  db.transfers.update({ ...doc, [field]: timed(action.payload.message) });
};

const transferSecretPersister: RaidenPersister = (db, _, action) => {
  if (!isActionOf([transferSecret, transferSecretRegister.success], action)) return;
  const doc = db.transfers.by('_id', transferKey(action.meta));
  if (!doc) return;
  // unconfirmed transferSecretRegister is handled as transferSecret:
  // acknowledge secret, but don't set it as registered yet
  if (transferSecret.is(action) || action.payload.confirmed === undefined) {
    if (doc.secret) return; // only update if secret is unset
  } else {
    // update if secret is unset or registerBlock needs update
    if (
      !action.payload.confirmed ||
      (doc.secret && doc.secretRegistered?.txBlock === action.payload.txBlock)
    )
      return;
  }
  db.transfers.update({
    ...doc,
    secret: action.payload.secret,
    ...(transferSecret.is(action) || action.payload.confirmed === undefined
      ? {}
      : { secretRegistered: timed(pick(['txHash', 'txBlock'], action.payload)) }),
  });
};

const fieldMap = {
  [transferSecretRequest.type]: 'secretRequest',
  [transferSecretReveal.type]: 'secretReveal',
  [transferProcessed.type]: 'transferProcessed',
  [transferUnlockProcessed.type]: 'unlockProcessed',
  [transferExpireProcessed.type]: 'expiredProcessed',
} as const;

const transferMessagesPersister: RaidenPersister = (db, _, action) => {
  if (
    !isActionOf(
      [
        transferSecretRequest,
        transferSecretReveal,
        transferProcessed,
        transferUnlockProcessed,
        transferExpireProcessed,
      ],
      action,
    )
  )
    return;
  const field = fieldMap[action.type];
  const doc = db.transfers.by('_id', transferKey(action.meta));
  if (!doc || (!transferSecretRequest.is(action) && doc[field])) return;
  db.transfers.update({ ...doc, [field]: timed(action.payload.message) });
};

const transferChannelClosedPersister: RaidenPersister = (db, _, action) => {
  if (!isActionOf([channelClose.success, channelSettle.success], action)) return;
  if (!action.payload.confirmed) return;
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
};

/**
 * Transfers root persister.
 * Since transfers states aren't kept in the state, but instead only on the database, they are
 * "reduced" and mutated synchronously by these persisters. The synchronous/in-memory database
 * (LokiJS) then is responsible for syncing it with the storage database (PouchDB).
 *
 * @param db - RaidenDatabase
 * @param states - new/prev states tuple
 * @param action - Raiden action
 */
export const transfersPersister: RaidenPersister = (db, states, action) => {
  for (const persister of [
    transferSignedPersister,
    transferUnlockExpirePersister,
    transferSecretPersister,
    transferMessagesPersister,
    transferChannelClosedPersister,
  ]) {
    persister(db, states, action);
  }
};
