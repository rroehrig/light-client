/* eslint-disable @typescript-eslint/no-explicit-any */
import { defer, merge, Observable, fromEvent, throwError, concat, from } from 'rxjs';
import {
  mergeMap,
  retry,
  map,
  pluck,
  takeUntil,
  filter,
  finalize,
  takeWhile,
  concatMap,
} from 'rxjs/operators';
import { bigNumberify } from 'ethers/utils';
import { HashZero } from 'ethers/constants';

import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
PouchDB.plugin(PouchDBFind);

import { assert } from '../utils';
import { RaidenState } from '../state';
import { Channel } from '../channels';
import { channelKey, channelUniqueKey } from '../channels/utils';
import { isntNil, last, Address } from '../utils/types';

import {
  RaidenDatabase,
  Migrations,
  RaidenDatabaseMeta,
  RaidenDatabaseOptions,
  RaidenDatabaseConstructor,
} from './types';
import getDefaultPouchAdapter from './adapter';
import defaultMigrations from './migrations';

/**
 * @param this - RaidenDatabase constructor, as static factory param
 * @param name - Name of database to check
 * @returns Promise to database, if it exists, false otherwise
 */
async function databaseExists(
  this: RaidenDatabaseConstructor,
  name: string,
): Promise<false | RaidenDatabase> {
  const db = new this(name);
  const info = await db.info();
  if (info.doc_count === 0 && info.update_seq == 0) {
    await db.destroy();
    return false;
  }
  return db;
}

/**
 * @param this - RaidenDatabase constructor, as static factory param
 * @param name - Database name or path
 * @returns RaidenDatabase
 */
async function makeDatabase(
  this: RaidenDatabaseConstructor,
  name: string,
): Promise<RaidenDatabase> {
  const db = new this(name);
  db.setMaxListeners(30);

  await Promise.all([
    db.createIndex({
      index: {
        name: 'receivedCompleted', // used by autoRegister, autoExpire & initReceived epics
        fields: ['direction', 'unlock', 'expired', 'secretRegistered'],
      },
    }),
    db.createIndex({
      index: {
        name: 'sentCompleted', // used by initSent epics
        fields: ['direction', 'unlockProcessed', 'expiredProcessed', 'secretRegistered'],
      },
    }),
    db.createIndex({
      index: {
        name: 'byPartner', // used by transferProcessedReceived epic
        fields: ['direction', 'partner'],
      },
    }),
    db.createIndex({
      index: {
        name: 'bySecrethash', // used by transferSecretRevealed epic
        fields: ['secrethash'],
      },
    }),
    db.createIndex({
      index: {
        name: 'byChannel', // used by transferSecretRevealed epic
        fields: ['channel'],
      },
    }),
  ]);

  return db;
}

/**
 * Upsert an entire document, based on given `_id`, into db
 *
 * @param db - Database to upsert doc in
 * @param doc - Doc to upsert in db
 * @param doc._id - _id (required) to upsert doc into
 * @returns Observable to retry upserting doc into db
 */
export function upsert$<D extends { _id: string; _rev?: string }>(db: RaidenDatabase, doc: D) {
  let first = true;
  return defer(async () => {
    // if _rev already present, try to use it
    if (first && doc._rev) {
      first = false;
      return doc;
    }
    return db.get(doc._id).catch(() => undefined);
  }).pipe(
    mergeMap((prevDoc) => db.put({ ...doc, _rev: prevDoc?._rev })),
    map((response) => {
      assert(response.ok);
      return response;
    }),
    retry(),
  );
}

/**
 * Like upsert$, but replace only given keys into the target document
 * This will retry while doc isn't found, so be sure it'll eventually be available
 *
 * @param db - Database to upsert doc in
 * @param doc - Doc to upsert; must contain at least _id; if it also contains _rev, it'll be
 *      assumed that this is a full doc, and will try to skip first db.get as an optimization
 * @param values - Values to set/replace inside doc
 * @returns Observable to retry up/set values into doc in db
 */
export function upSet$<D extends { _id: string; _rev?: string }>(
  db: RaidenDatabase,
  doc: D,
  values: { [k: string]: any },
) {
  let first = true;
  return defer(async () => {
    if (first && doc._rev) {
      first = false;
      return doc;
    }
    // db.get will throw if not found, so it can be retried
    return db.get(doc._id);
  }).pipe(
    mergeMap((prevDoc) => db.put({ ...prevDoc, ...values, _rev: prevDoc._rev })),
    map((response) => {
      assert(response.ok);
      return response;
    }),
    retry(),
  );
}

/**
 * Create an observable over a db.changes event stream, with proper teardown
 *
 * @param db - Database to upsert doc in
 * @param options - db.changes options
 * @returns Observable of changes responses
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function changes$<T = {}>(db: RaidenDatabase, options?: PouchDB.Core.ChangesOptions) {
  // concat allows second defer to be skipped in case of first()/take(1) succeeding
  return defer(() => {
    const feed = db.changes<T>(options);
    return merge(
      fromEvent<PouchDB.Core.ChangesResponseChange<T>>(feed, 'change', (change) => change),
      fromEvent<any>(feed, 'error').pipe(mergeMap((error) => throwError(error))),
    ).pipe(
      takeUntil(fromEvent(feed, 'complete')),
      finalize(() => feed.cancel()),
    );
  });
}

/**
 * Find or wait for a document by id and re-emit it whenever it changes
 *
 * @param db - Database to upsert doc in
 * @param docId - Doc _id to monitor
 * @returns Observable to retry upserting doc into db
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function get$<T = {}>(db: RaidenDatabase, docId: string): Observable<T> {
  return concat(
    defer(() => db.get<T>(docId).catch(() => null)).pipe(filter(isntNil)),
    changes$<T>(db, {
      since: 'now',
      live: true,
      include_docs: true,
      doc_ids: [docId],
    }).pipe(
      takeWhile(({ deleted }) => !deleted),
      pluck('doc'),
      filter(isntNil),
    ),
  );
}

/**
 * @param prefix - Prefix to query for
 * @param descending - Wether to swap start & endkey for reverse reverse search
 * @returns allDocs's options to fetch all documents which keys start with prefix
 */
export function byPrefix(prefix: string, descending = false) {
  const start = prefix;
  const end = prefix + '\ufff0';
  return !descending
    ? { startkey: start, endkey: end }
    : { startkey: end, endkey: start, descending };
}

const statePrefix = 'state.';
const channelsPrefix = 'channels.';

/**
 * [[dbStateEpic]] stores each key of RaidenState as independent value on the database, prefixed
 * with 'state.', to make it cheaper to save changes touching only a subset of the state.
 * 'channels' (being a special hotpath of complex objects) are split as one entry per channel.
 * This function reads this format, fetching the multiple rows from database and composing an
 * object which should be decodable by [[RaidenState]] codec.
 *
 * @param db - Database to query state from
 * @returns mapping object potentially decodable to RaidenState
 */
export async function getRaidenState(db: RaidenDatabase): Promise<any | undefined> {
  const state = { channels: {}, oldChannels: {} } as any;

  const [stateResults, channelsResults] = await Promise.all([
    db.allDocs<{ value: any }>({
      include_docs: true,
      ...byPrefix(statePrefix),
    }),
    db.allDocs<any>({
      include_docs: true,
      ...byPrefix(channelsPrefix),
    }),
  ]);

  for (const { id, doc } of stateResults.rows) {
    state[id.substr(statePrefix.length)] = doc!.value;
  }
  for (const { doc } of channelsResults.rows) {
    if (doc!.settleBlock) state.oldChannels[channelUniqueKey(doc)] = doc;
    else state.channels[channelKey(doc!)] = doc!;
  }

  if ('address' in state) return state;
}

/**
 * Like [[dbStateEpic]], stores each key of RaidenState as independent value on the database,
 * prefixed * with 'state.', to make it cheaper to save changes touching only a subset of the state.
 * 'channels' (being a special hotpath of complex objects) are split as one entry per channel.
 * Used to store initial state
 *
 * @param db - Database to store state into
 * @param state - State to persist
 * @returns Promise to void
 */
export async function putRaidenState(db: RaidenDatabase, state: RaidenState): Promise<void> {
  for (const [key, value] of Object.entries(state)) {
    if (key === 'channels' || key === 'oldChannels') {
      for (const channel of Object.values<Channel>(value)) {
        await upsert$(db, {
          _id: channelsPrefix + channelUniqueKey(channel),
          ...value,
        }).toPromise();
      }
    } else {
      await upsert$(db, { _id: statePrefix + key, value }).toPromise();
    }
  }
}

function sortMigrations(migrations: Migrations): number[] {
  return Object.keys(migrations)
    .map((k) => +k)
    .sort();
}

function latestVersion(migrations: Migrations = defaultMigrations): number {
  return last(sortMigrations(migrations)) ?? 0;
}

function databaseVersion(db: RaidenDatabase): number {
  return +db.name.match(/_(\d+)$/)![1];
}

/**
 * @param opts - Default database options
 * @returns Constructor function for RaidenDatabase
 */
export async function getDatabaseConstructorFromOptions(
  opts: RaidenDatabaseOptions,
): Promise<RaidenDatabaseConstructor> {
  if (!opts.adapter) opts.adapter = await getDefaultPouchAdapter();
  return PouchDB.defaults(opts) as RaidenDatabaseConstructor;
}

/**
 * Detects current version on storage, and migrate it to latest version if needed, resolving to the
 * initialized database instance. May reject if migration fails.
 *
 * @param this - RaidenDatabase constructor, as static factory param
 * @param name - Database name (to be suffixed with versions)
 * @param migrations - Map of migrations, indexed by target version number, starting with 1;
 *      Each migration is an async function which receives each entry/row of the previous db and
 *      the old db instance (in case one needs to fetch some data from some other row), and
 *      resolves to an array of new documents (without `_rev`) to be put in the upgraded database.
 *      To remove an entry, simply return empty array, or just return [doc] to migrate as is.
 * @param cleanOld - Whether to clean/remove successfully migrated databases or leave it
 * @returns Promise to instance of currentVersion of database
 */
export async function migrateDatabase(
  this: RaidenDatabaseConstructor,
  name: string,
  migrations: Migrations = defaultMigrations,
  cleanOld = false,
): Promise<RaidenDatabase> {
  const { log } = this.__defaults;
  const sortedMigrations = sortMigrations(migrations);

  let version = 0;
  let db: RaidenDatabase | undefined;
  for (let i = sortedMigrations.length - 1; i >= 0; --i) {
    const _version = sortedMigrations[i];
    const _db = await databaseExists.call(this, `${name}_${_version}`);
    if (_db) {
      version = _version;
      db = _db;
      break;
    }
  }
  if (!db) {
    version = latestVersion(migrations);
    db = await makeDatabase.call(this, `${name}_${version}`);
  }

  for (const newVersion of sortedMigrations) {
    if (newVersion <= version) continue;
    const newDb = await makeDatabase.call(this, `${name}_${newVersion}`);

    try {
      const keyRe = /^[a-z]/i;
      await changes$(db, { since: 0, include_docs: true, filter: ({ _id }) => keyRe.test(_id) })
        .pipe(
          concatMap((change) =>
            defer(() => migrations[newVersion](change.doc!, db!)).pipe(
              mergeMap((results) => from(results)),
              concatMap(async (result) => {
                if ('_rev' in result) delete result['_rev'];
                return newDb.put(result);
              }),
            ),
          ),
        )
        .toPromise();
    } catch (err) {
      log?.error?.('Error migrating db', { from: version, to: newVersion }, err);
      newDb.destroy();
      throw err;
    }
    log?.info?.('Migrated db', { from: version, to: newVersion });
    if (cleanOld) await db.destroy();
    else await db.close();
    version = newVersion;
    db = newDb;
  }
  // shouldn't happen
  assert(databaseVersion(db) === latestVersion(migrations), 'Not latest version');
  return db;
}

/**
 * @param db - Raiden database to fetch meta from
 * @returns Promise which resolves to meta information from database
 */
export async function databaseMeta(db: RaidenDatabase): Promise<RaidenDatabaseMeta> {
  return {
    _id: '_meta',
    version: databaseVersion(db),
    network: (await db.get<{ value: number }>(statePrefix + 'chainId')).value,
    registry: (await db.get<{ value: Address }>(statePrefix + 'registry')).value,
    address: (await db.get<{ value: Address }>(statePrefix + 'address')).value,
    blockNumber: (await db.get<{ value: number }>(statePrefix + 'blockNumber')).value,
  };
}

function isAsyncIterable<T>(v: Iterable<T> | AsyncIterable<T>): v is AsyncIterable<T> {
  return typeof (v as AsyncIterable<T>)[Symbol.asyncIterator] === 'function';
}

/**
 * Replace current database with data from a given state dump; the dump must not be older than
 * the state in storage.
 *
 * @param this - RaidenDatabase constructor, as static factory param
 * @param data - (possibly async) iterable which yields state entries; must start with '_meta'
 * @param name - Database name (to be suffixed with versions)
 * @param migrations - Map of migrations, indexed by target version number, starting with 1;
 *      Each migration is an async function which receives each entry/row of the previous db and
 *      the old db instance (in case one needs to fetch some data from some other row), and
 *      resolves to an array of new documents (without `_rev`) to be put in the upgraded database.
 *      To remove an entry, simply return empty array, or just return [doc] to migrate as is.
 * @param cleanOld - Weather to clean/remove successfully migrated databases
 * @returns Promise to instance of currentVersion of database
 */
export async function loadDatabase(
  this: RaidenDatabaseConstructor,
  data: Iterable<any> | AsyncIterable<any>,
  name: string,
  migrations: Migrations = defaultMigrations,
  cleanOld = false,
): Promise<RaidenDatabase> {
  const iter = isAsyncIterable(data) ? data[Symbol.asyncIterator]() : data[Symbol.iterator]();
  const first = await iter.next();
  assert(!first.done && first.value._id === '_meta', 'first yielded value must be "_meta"');
  const meta: RaidenDatabaseMeta = first.value;

  // ensure db's current version in store is older than replacement
  for (let version = latestVersion(migrations); version >= meta.version; --version) {
    const dbName = `${name}_${version}`;
    const db = await databaseExists.call(this, dbName);
    if (!db) continue;
    const dbMeta = await databaseMeta(db);
    assert(
      meta.version >= version && meta.blockNumber > dbMeta.blockNumber,
      'Trying to replace existing database with an older version',
    );
    // shouldn't happen, since [name] is generated from these parameters
    assert(
      meta.address === dbMeta.address &&
        meta.registry === dbMeta.registry &&
        meta.network === dbMeta.network,
      'Incompatible meta values',
    );
    // drop versions which would make migration fail
    await db.destroy();
  }

  // iterate and insert entries into db for replacement's version
  const dbName = `${name}_${meta.version}`;
  const db = await makeDatabase.call(this, dbName);
  let next = await iter.next();
  while (!next.done) {
    const doc = next.value;
    if ('_rev' in doc) delete doc['_rev'];
    [next] = await Promise.all([iter.next(), db.put(doc)]);
  }
  await db.close();

  // at this point, `{name}_{meta.version}` database should contain all (and only) data from
  // iterable, and no later version of database should exist, so we can safely migrate
  return await migrateDatabase.call(this, name, migrations, cleanOld);
}

function keyAfter(key: string): string {
  return !key ? '' : key.slice(0, -1) + String.fromCharCode(key.slice(-1).charCodeAt(0) + 1);
}

/**
 * Creates an async generator which yields database entries documents.
 * Can be dumped to a JSON array or streamed. Will throw if database changes while dumping, to
 * invalidate previous dump.  Caller must ensure the database can't change while dumping or handle
 * the exception to restart.
 *
 * @param db - Database to dump
 * @param opts - Options
 * @param opts.batch - Size of batches to fetch and yield
 * @returns Generator of documents
 */
export async function* dumpDatabase(db: RaidenDatabase, { batch = 10 }: { batch?: number } = {}) {
  let changed: string | undefined;
  const feed = db.changes({ since: 'now', live: true });
  feed.on('change', ({ id }) => (changed = id));
  try {
    yield await databaseMeta(db);
    let startkey = 'a';
    while (true) {
      const results = await db.allDocs({
        startkey,
        endkey: '\ufff0',
        limit: batch,
        include_docs: true,
      });

      yield* results.rows.map(({ doc }) => doc!);
      assert(!changed, ['Database changed while dumping', { key: changed! }]);

      const end = last(results.rows);
      if (end) startkey = keyAfter(end.id);
      else break;
    }
  } finally {
    feed.cancel();
  }
}

async function reopenDatabase(db: RaidenDatabase): Promise<RaidenDatabase> {
  return makeDatabase.call(db.constructor, db.name);
}

/**
 * Creates an array containing all documents in the database; retries database change errors
 *
 * @param db - Database to dump
 * @param opts - Options
 * @param opts.batch - Size of batches to fetch and yield
 * @returns Array of documents
 */
export async function dumpDatabaseToArray(db: RaidenDatabase, opts?: { batch?: number }) {
  const { log } = db.constructor.__defaults;
  let shouldCloseAfter = false;
  let i = 10;
  while (--i) {
    try {
      const result = [];
      for await (const doc of dumpDatabase(db, opts)) {
        result.push(doc);
      }
      if (shouldCloseAfter) await db.close(); // on success
      return result;
    } catch (e) {
      if (e.message?.includes?.('database is closed')) {
        shouldCloseAfter = true;
        db = await reopenDatabase(db);
      }
      log?.warn?.('Restarting dump because', e);
    }
  }
}

/**
 * Generate a new database dump from old RaidenState JSON object
 *
 * @param state - Legacy (before PouchDB) state
 */
export function* legacyStateMigration(state: any) {
  const meta: RaidenDatabaseMeta = {
    _id: '_meta',
    version: 0,
    network: state.chainId,
    registry: state.registry,
    address: state.address,
    blockNumber: state.blockNumber,
  };
  yield meta;

  for (const [key, value] of Object.entries<any>(state)) {
    if (key === 'channels' || key === 'oldChannels') {
      for (const channel of Object.values<any>(value)) {
        yield { _id: channelsPrefix + channelUniqueKey(channel), ...channel };
      }
    } else if (key === 'sent' || key === 'received') {
      for (const transfer of Object.values<any>(value)) {
        yield {
          _id: `${key}:${transfer.transfer.lock.secrethash}`,
          direction: key,
          secrethash: transfer.transfer.lock.secrethash,
          expiration: bigNumberify(transfer.transfer.lock.expiration).toNumber(),
          channel: `${transfer.transfer.token_network_address}@${transfer.partner}#${bigNumberify(
            transfer.transfer.channel_identifier,
          )
            .toString()
            .padStart(9, '0')}`,
          ...(transfer.secret?.registerBlock
            ? {
                secretRegistered: {
                  txHash: HashZero,
                  txBlock: transfer.secret.registerBlock,
                  ts: 1,
                },
              }
            : {}),
          ...transfer,
          ...(transfer.secret ? { secret: transfer.secret.value } : {}),
          ...(transfer.lockExpired ? { expired: transfer.lockExpired } : {}),
        };
      }
    } else {
      yield { _id: statePrefix + key, value };
    }
  }
}
