/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises as fs } from 'fs';
import path from 'path';

import { RaidenState } from 'raiden-ts/state';
import { TransferState } from 'raiden-ts/transfers/state';
import { decode } from 'raiden-ts/utils/types';
import {
  getDatabaseConstructorFromOptions,
  getRaidenState,
  legacyStateMigration,
  replaceDatabase,
} from 'raiden-ts/db/utils';
import { jsonParse } from 'raiden-ts/utils/data';

test('migrate and decode', async () => {
  // iterate over past stored JSON states & ensure they can be migrated to current
  const dir = path.join(path.dirname(await fs.realpath(__filename)), 'states');
  const states = await fs.readdir(dir);

  // PouchDB configs are passed as custom database constructor using PouchDB.defaults
  const dbCtor = await getDatabaseConstructorFromOptions({ adapter: 'memory' });

  for (const file of states) {
    if (!file.toLowerCase().endsWith('json')) continue;

    const dbName = `raiden_${file}`;
    console.info('migrating', file);
    let dump: any = await fs.readFile(path.join(dir, file), { encoding: 'utf-8' });

    if (typeof dump === 'string') dump = jsonParse(dump);
    if (!Array.isArray(dump)) dump = Array.from(legacyStateMigration(dump));
    const db = await replaceDatabase.call(dbCtor, dump, dbName);

    const decodedState = decode(RaidenState, getRaidenState(db));
    expect(RaidenState.is(decodedState)).toBe(true);

    for (const transfer of db.transfers.find()) {
      const decodedTransfer = decode(TransferState, transfer);
      expect(TransferState.is(decodedTransfer)).toBe(true);
    }
  }
});
