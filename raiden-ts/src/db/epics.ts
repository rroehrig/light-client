import { Observable } from 'rxjs';
import { ignoreElements, finalize } from 'rxjs/operators';

import { RaidenAction } from '../actions';
import { RaidenState } from '../state';
import { RaidenEpicDeps } from '../types';

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
    finalize(async () => {
      // we can't use loki.close callback because we replace setInterval-based autosave
      db.db.close();
      // so we simply wait for any pending saveDatabase to complete before closing storage
      while (db.db.throttledSavePending) await new Promise((resolve) => setTimeout(resolve, 1));
      db.storage.close();
    }),
  );
