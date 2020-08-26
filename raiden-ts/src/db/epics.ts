import { Observable } from 'rxjs';
import {
  distinctUntilChanged,
  concatMap,
  ignoreElements,
  pairwise,
  mergeMap,
  groupBy,
  finalize,
} from 'rxjs/operators';

import { RaidenAction } from '../actions';
import { RaidenState } from '../state';
import { RaidenEpicDeps } from '../types';
import { channelUniqueKey } from '../channels/utils';
import { upsert$ } from './utils';

/**
 * Update state based on actions and state changes
 *
 * For certain common actions with trivial reduced state side-effects, it may try to produce an
 * optimized update command. Otherwise, the whole state will be upserted.
 *
 * @param action$ - Observable of RaidenActions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.db - Database instance
 * @returns observable to persist state changes to db
 */
export const dbStateEpic = (
  {}: Observable<RaidenAction>,
  state$: Observable<RaidenState>,
  { db }: RaidenEpicDeps,
): Observable<never> =>
  state$.pipe(
    distinctUntilChanged(),
    pairwise(),
    mergeMap(function* ([prev, cur]) {
      for (const k in cur) {
        const key = k as keyof RaidenState;
        // key has same value, pass over
        if (cur[key] === prev[key]) continue;
        else if (key === 'channels' || key === 'oldChannels') {
          // iterate over channels separately
          for (const id in cur[key]) {
            if (cur[key][id] === prev[key][id]) continue;
            yield { _id: `channels.${channelUniqueKey(cur[key][id])}`, ...cur[key][id] };
          }
        } else yield { _id: `state.${key}`, value: cur[key] } as const;
        // notice we don't handle deleted values: the set of top-level keys are constant,
        // oldChannels aren't deleted, and current channels are only moved to oldChannels,
        // which share the [channelUniqueKey], so they get replaced
      }
    }),
    groupBy(({ _id }) => _id),
    mergeMap((grouped$) => grouped$.pipe(concatMap((doc) => upsert$(db, doc)))),
    ignoreElements(),
  );

/**
 * Shutdown database instance when raiden shuts down
 *
 * @param action$ - Observable of RaidenActions
 * @param state$ - Observable of RaidenStates
 * @param deps - Epics dependencies
 * @param deps.db - Database instance
 * @returns observable to shutdown db instance on raidenShutdown
 */
export const dbShutdownEpic = (
  action$: Observable<RaidenAction>,
  {}: Observable<RaidenState>,
  { db }: RaidenEpicDeps,
): Observable<never> =>
  action$.pipe(
    ignoreElements(),
    finalize(() => db.close()),
  );
