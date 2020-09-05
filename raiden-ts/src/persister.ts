/**
 * This file introduces a 'persister' middleware for redux
 *
 * It's coupled with RaidenDatabase, and runs a root _reducer-like_ function for each action/state
 * change going through redux state machine.
 * The function receives the RaidenDatabase instance, a tuple containing the current and previous
 * state, and the action which triggered this change. Like reducers, the function **must not**
 * change state, but in this case, return value is also ignored. Instead, it should do whatever
 * logic it needs to persist the new state on the database. Redux-state changes should still be
 * performed on reducers, as usual.
 * This is useful as a reducer-like synchronous function for members of the state which aren't
 * kept in the state, but on the database instead, or to sync/persist state changes to the
 * database storage.
 */

import { Dispatch, Middleware } from 'redux';
import type { RaidenState } from './state';
import type { RaidenAction } from './actions';
import type { RaidenDatabase } from './db/types';
import { upsert } from './db/utils';

import { transfersPersister } from './transfers/persister';

/**
 * Persister function type: receives RaidenDatabase, new/prev state tuple, and action
 */
export type RaidenPersister = (
  db: RaidenDatabase,
  states: readonly [currentState: RaidenState, prevState: RaidenState],
  action: RaidenAction,
) => void;

/**
 * Raiden root persister: called by the persister middleware. Should call sub-persisters if needed
 * Persisters should be synchronous, since they block the state machine.
 *
 * @param db - RaidenDatabase to persist/sync state on
 * @param states - Pair of new/prev RaidenStates
 * @param action - Action which got dispatched through redux
 */
export const raidenRootPersister: RaidenPersister = (db, states, action) => {
  const [state, prev] = states;
  if (state !== prev) {
    for (const k in state) {
      const key = k as keyof RaidenState;
      // key has same value, pass over
      if (state[key] === prev[key]) continue;
      else if (key === 'channels' || key === 'oldChannels') {
        // iterate over channels separately
        for (const id in state[key]) {
          if (state[key][id] === prev[key][id]) continue;
          db.storageKeys.add(`channels.${state[key][id]._id}`);
          upsert(db.channels, state[key][id]);
        }
      } else {
        db.storageKeys.add(`state.${key}`);
        upsert(db.state, { _id: key, value: state[key] });
      }
      // notice we don't handle deleted values: the set of top-level keys are constant,
      // oldChannels aren't deleted, and current channels are only moved to oldChannels,
      // which share the [channelUniqueKey], so they get replaced
    }
  }

  // sub persisters
  for (const persister of [transfersPersister]) persister(db, states, action);
};

/**
 * Create a raiden persister middleware for redux.
 * It calls a given root persister every time an action goes through Redux state machine, passing
 * the db RaidenDatabase, new and previous states, and the action.
 * The persister gets called after the action reduced the state.
 *
 * @param db - Raiden Database object, passed to persister
 * @param persister - Root persister to run
 * @returns Middleware function to be applied to redux
 */
export function createPersisterMiddleware(
  db: RaidenDatabase,
  persister: RaidenPersister = raidenRootPersister,
): Middleware<undefined, RaidenState, Dispatch<RaidenAction>> {
  const log = db.storage.constructor.__defaults.log;
  return (store) => (next) => (action) => {
    const prevState = store.getState();
    const result = next(action);
    const state = store.getState();
    try {
      persister(db, [state, prevState], action);
    } catch (err) {
      log?.warn?.('Persister error', err);
    }
    return result;
  };
}
