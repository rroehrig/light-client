import { channelKey } from '../channels/utils';
import { RaidenState, initialState } from '../state';
import { RaidenAction } from '../actions';
import { ChannelState } from '../channels/state';
import { UInt } from '../utils/types';
import { Reducer, createReducer } from '../utils/actions';
import { getBalanceProofFromEnvelopeMessage } from '../messages/utils';
import { Direction } from './state';
import {
  transferSigned,
  transferUnlock,
  transferExpire,
  withdrawMessage,
  withdrawExpire,
  withdrawCompleted,
} from './actions';

const END = { [Direction.SENT]: 'own', [Direction.RECEIVED]: 'partner' } as const;

function transferEnvelopeReducer(
  state: RaidenState,
  action: transferSigned | transferExpire.success | transferUnlock.success,
): RaidenState {
  const message = action.payload.message;
  const secrethash = action.meta.secrethash;
  const tokenNetwork = message.token_network_address;
  const partner = action.payload.partner;
  const key = channelKey({ tokenNetwork, partner });
  const end = END[action.meta.direction];
  let channel = state.channels[key];

  // nonce must be next, otherwise we already processed this message; validation happens on epic;
  if (channel?.state !== ChannelState.open || !message.nonce.eq(channel[end].nextNonce))
    return state;

  const locks = transferSigned.is(action)
    ? [...channel[end].locks, action.payload.message.lock] // append lock
    : channel[end].locks.filter((l) => l.secrethash !== secrethash); // pop lock
  channel = {
    ...channel,
    [end]: {
      ...channel[end],
      locks,
      // set current/latest channel[end].balanceProof
      balanceProof: getBalanceProofFromEnvelopeMessage(message),
      nextNonce: channel[end].nextNonce.add(1) as UInt<8>, // always increment nextNonce
    },
  };

  // both transfer's and channel end's state changes done atomically
  return {
    ...state,
    channels: { ...state.channels, [key]: channel },
  };
}

function withdrawReducer(
  state: RaidenState,
  action: withdrawMessage.request | withdrawMessage.success | withdrawExpire.success,
): RaidenState {
  const message = action.payload.message;
  const key = channelKey(action.meta);
  let channel = state.channels[key];

  // messages always update sender's nonce, i.e. requestee's for confirmations, else requester's
  const senderEnd =
    (action.meta.direction === Direction.RECEIVED) !== withdrawMessage.success.is(action)
      ? 'partner'
      : 'own';
  // nonce must be next, otherwise already processed message, skip
  if (channel?.state !== ChannelState.open || !message.nonce.eq(channel[senderEnd].nextNonce))
    return state;
  channel = {
    ...channel,
    [senderEnd]: {
      ...channel[senderEnd],
      nextNonce: channel[senderEnd].nextNonce.add(1) as UInt<8>, // no BP, but increment nextNonce
    },
  };

  // all messages are stored in 'pendingWithdraws' array on requester's/withdrawer's side
  const withdrawerEnd = action.meta.direction === Direction.RECEIVED ? 'partner' : 'own';
  const pendingWithdraws = [...channel[withdrawerEnd].pendingWithdraws, action.payload.message];
  // senderEnd == withdrawerEnd for request & expiration, and the other for confirmation
  channel = {
    ...channel,
    [withdrawerEnd]: {
      ...channel[withdrawerEnd],
      pendingWithdraws,
    },
  };

  return { ...state, channels: { ...state.channels, [key]: channel } };
}

function withdrawCompletedReducer(state: RaidenState, action: withdrawCompleted): RaidenState {
  const key = channelKey(action.meta);
  let channel = state.channels[key];
  if (channel?.state !== ChannelState.open) return state;

  const end = action.meta.direction === Direction.RECEIVED ? 'partner' : 'own';
  // filters out all withdraw messages matching meta
  const pendingWithdraws = channel[end].pendingWithdraws.filter(
    (req) =>
      !req.expiration.eq(action.meta.expiration) ||
      !req.total_withdraw.eq(action.meta.totalWithdraw),
  );
  channel = {
    ...channel,
    [end]: {
      ...channel[end],
      pendingWithdraws,
    },
  };
  return { ...state, channels: { ...state.channels, [key]: channel } };
}

/**
 * Handles all transfers actions and requests
 */
const transfersReducer: Reducer<RaidenState, RaidenAction> = createReducer(initialState)
  .handle(
    [transferSigned, transferUnlock.success, transferExpire.success],
    transferEnvelopeReducer,
  )
  .handle(
    [withdrawMessage.request, withdrawMessage.success, withdrawExpire.success],
    withdrawReducer,
  )
  .handle(withdrawCompleted, withdrawCompletedReducer);
export default transfersReducer;
