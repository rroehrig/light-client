/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  defer,
  merge,
  Observable,
  fromEvent,
  throwError,
  from,
  of,
  concat,
  fromEventPattern,
} from 'rxjs';
import { mergeMap, pluck, takeUntil, filter, finalize, concatMap, take } from 'rxjs/operators';
import { bigNumberify } from 'ethers/utils';
import { HashZero } from 'ethers/constants';

import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
PouchDB.plugin(PouchDBFind);

import Loki from 'lokijs';

import { assert } from '../utils';
import { RaidenState } from '../state';
import { Channel } from '../channels';
import { channelKey, channelUniqueKey } from '../channels/utils';
import { last, Address } from '../utils/types';

import { TransferState } from '../transfers/state';
import {
  RaidenStorage,
  Migrations,
  RaidenDatabaseMeta,
  RaidenDatabaseOptions,
  RaidenStorageConstructor,
  RaidenDatabase,
  StateMember,
} from './types';
import { getDefaultPouchAdapter, LokiRaidenAdapter } from './adapter';
import defaultMigrations from './migrations';

/**
 * @param this - RaidenStorage constructor, as static factory param
 * @param name - Name of database to check
 * @returns Promise to database, if it exists, false otherwise
 */
async function storageExists(
  this: RaidenStorageConstructor,
  name: string,
): Promise<false | RaidenStorage> {
  const storage = new this(name);
  const info = await storage.info();
  if (info.doc_count === 0 && info.update_seq == 0) {
    await storage.destroy();
    return false;
  }
  return storage;
}

/**
 * @param this - RaidenStorage constructor, as static factory param
 * @param name - Database name or path
 * @returns RaidenStorage
 */
async function makeStorage(this: RaidenStorageConstructor, name: string): Promise<RaidenStorage> {
  const storage = new this(name);
  storage.setMaxListeners(30);

  await Promise.all([
    storage.createIndex({
      index: {
        name: 'completed', // selects channels where no further action is possible/needed
        fields: ['direction', 'unlockProcessed', 'expiredProcessed', 'channelSettled'],
      },
    }),
    storage.createIndex({
      index: {
        name: 'byPartner',
        fields: ['direction', 'partner'],
      },
    }),
    storage.createIndex({
      index: {
        name: 'bySecrethash',
        fields: ['secrethash'],
      },
    }),
    storage.createIndex({
      index: {
        name: 'byChannel',
        fields: ['channel'],
      },
    }),
  ]);

  return storage;
}

async function makeDatabase(storage: RaidenStorage): Promise<RaidenDatabase> {
  const db = await new Promise<Loki>((resolve, reject) => {
    const db: Loki = new Loki(storage.name, {
      adapter: new LokiRaidenAdapter(storage),
      autoload: true,
      autoloadCallback: (res) => (res ? reject(res) : resolve(db)),
    });
  });
  const state = db.getCollection<StateMember>('state');
  const channels = db.getCollection<Channel>('channels');
  const transfers = db.getCollection<TransferState>('transfers');

  // replace setInterval-based autosave logic with insta-save-when-dirty using getters/setters
  db.collections.forEach((coll) => {
    let dirty = false;
    Object.defineProperty(coll, 'dirty', {
      get: () => dirty,
      set: (v: boolean) => {
        dirty = v;
        if (v) db.saveDatabase();
      },
    });
  });

  // populate transfersKeys with all keys from database, since loki only keep track of a subset
  // of the transfers
  const storageKeys = new Set<string>();
  const results = await storage.allDocs({ startkey: 'a', endkey: 'z\ufff0' });
  results.rows.forEach(({ id }) => storageKeys.add(id));

  return { storage, db, state, channels, transfers, storageKeys };
}

/**
 * @param coll - Collection to upsert into
 * @param data - Data to be upserted
 */
export function upsert<T extends { _id: string }>(coll: Loki.Collection<T>, data: T) {
  const doc = coll.by('_id', data._id);
  if (doc) coll.update({ ...doc, ...data });
  else coll.insert(data);
}

/**
 * Create observable of PouchDB.changes stream, with proper teardown
 *
 * @param storage - Database to upsert doc in
 * @param options - db.changes options
 * @returns Observable of changes responses
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function changes$<T = {}>(storage: RaidenStorage, options?: PouchDB.Core.ChangesOptions) {
  // concat allows second defer to be skipped in case of first()/take(1) succeeding
  return defer(() => {
    const feed = storage.changes<T>(options);
    return merge(
      fromEvent<[PouchDB.Core.ChangesResponseChange<T>]>(feed, 'change'),
      fromEvent<any>(feed, 'error').pipe(mergeMap((error) => throwError(error))),
    ).pipe(
      pluck(0),
      takeUntil(fromEvent(feed, 'complete')),
      finalize(() => feed.cancel()),
    );
  });
}

/**
 * Find or wait for a document by _id and re-emit it whenever it changes
 *
 * @param collection - Collection to fetch/listen events from
 * @param docId - doc._id to monitor
 * @returns Observable of docs changes
 */
export function get$<T extends { _id: string } = { _id: string }>(
  collection: Loki.Collection<T>,
  docId: string,
): Observable<T> {
  const on = <U>(eventName: string) =>
    fromEventPattern<U>(
      (handler) => collection.addListener(eventName, handler),
      // synchronous removeListener would raise issues with listeners.forEach from LokiEventEmitter
      (handler) => setTimeout(() => collection.removeListener(eventName, handler), 0),
    );
  const filterDoc = filter<T>(({ _id }) => _id === docId);
  return concat(
    defer(() => {
      const doc = collection.by('_id', docId);
      if (doc) return of(doc);
      return on<T>('insert').pipe(filterDoc, take(1));
    }),
    on<[T, T]>('update').pipe(pluck(0), filterDoc),
  ).pipe(takeUntil(on<T>('delete').pipe(filterDoc)));
}

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
export function getRaidenState(db: RaidenDatabase): any | undefined {
  const state = { channels: {}, oldChannels: {} } as any;

  for (const { _id, value } of db.state.find()) {
    state[_id] = value;
  }
  for (const doc of db.channels.find()) {
    if ('settleBlock' in doc) state.oldChannels[doc._id] = doc;
    else state.channels[channelKey(doc)] = doc;
  }

  if ('address' in state) return state;
}

/**
 * Like [[dbStateEpic]], stores each key of RaidenState as independent value on the database,
 * prefixed * with 'state.', to make it cheaper to save changes touching only a subset of the state.
 * 'channels' (being a special hotpath of complex objects) are split as one entry per channel.
 * Used to store initial state (on empty db)
 *
 * @param db - Database to store state into
 * @param state - State to persist
 */
export function putRaidenState(db: RaidenDatabase, state: RaidenState): void {
  for (const [key, value] of Object.entries(state)) {
    if (key === 'channels' || key === 'oldChannels') {
      for (const channel of Object.values<Channel>(value)) {
        db.channels.insert(channel);
      }
    } else {
      db.state.insert({ _id: key, value });
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

function databaseVersion(storage: RaidenStorage): number {
  return +storage.name.match(/_(\d+)$/)![1];
}

/**
 * @param opts - Default database options
 * @returns Constructor function for RaidenStorage
 */
export async function getDatabaseConstructorFromOptions(
  opts: RaidenDatabaseOptions,
): Promise<RaidenStorageConstructor> {
  if (!opts.adapter) opts.adapter = await getDefaultPouchAdapter();
  return PouchDB.defaults(opts) as RaidenStorageConstructor;
}

/**
 * Detects current version on storage, and migrate it to latest version if needed, resolving to the
 * initialized database instance. May reject if migration fails.
 *
 * @param this - RaidenStorage constructor, as static factory param
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
  this: RaidenStorageConstructor,
  name: string,
  migrations: Migrations = defaultMigrations,
  cleanOld = false,
): Promise<RaidenDatabase> {
  const { log } = this.__defaults;
  const sortedMigrations = sortMigrations(migrations);

  let version = 0;
  let storage: RaidenStorage | undefined;
  for (let i = sortedMigrations.length - 1; i >= 0; --i) {
    const _version = sortedMigrations[i];
    const _storage = await storageExists.call(this, `${name}_${_version}`);
    if (_storage) {
      version = _version;
      storage = _storage;
      break;
    }
  }
  if (!storage) {
    version = latestVersion(migrations);
    storage = await makeStorage.call(this, `${name}_${version}`);
  }

  for (const newVersion of sortedMigrations) {
    if (newVersion <= version) continue;
    const newStorage = await makeStorage.call(this, `${name}_${newVersion}`);

    try {
      const keyRe = /^[a-z]/i;
      await changes$(storage, {
        since: 0,
        include_docs: true,
        filter: ({ _id }) => keyRe.test(_id),
      })
        .pipe(
          concatMap((change) =>
            defer(() => migrations[newVersion](change.doc!, storage!)).pipe(
              mergeMap((results) => from(results)),
              concatMap(async (result) => {
                if ('_rev' in result) delete result['_rev'];
                return newStorage.put(result);
              }),
            ),
          ),
        )
        .toPromise();
    } catch (err) {
      log?.error?.('Error migrating db', { from: version, to: newVersion }, err);
      newStorage.destroy();
      throw err;
    }
    log?.info?.('Migrated db', { from: version, to: newVersion });
    if (cleanOld) await storage.destroy();
    else await storage.close();
    version = newVersion;
    storage = newStorage;
  }
  const db = await makeDatabase(storage);
  // shouldn't fail
  assert(databaseVersion(db.storage) === latestVersion(migrations), 'Not latest version');
  return db;
}

const statePrefix = 'state.';
const channelsPrefix = 'channels.';

/**
 * @param storage - Raiden database to fetch meta from
 * @returns Promise which resolves to meta information from database
 */
export async function databaseMeta(storage: RaidenStorage): Promise<RaidenDatabaseMeta> {
  return {
    _id: '_meta',
    version: databaseVersion(storage),
    network: (await storage.get<{ value: number }>(statePrefix + 'chainId')).value,
    registry: (await storage.get<{ value: Address }>(statePrefix + 'registry')).value,
    address: (await storage.get<{ value: Address }>(statePrefix + 'address')).value,
    blockNumber: (await storage.get<{ value: number }>(statePrefix + 'blockNumber')).value,
  };
}

function isAsyncIterable<T>(v: Iterable<T> | AsyncIterable<T>): v is AsyncIterable<T> {
  return typeof (v as AsyncIterable<T>)[Symbol.asyncIterator] === 'function';
}

/**
 * Replace current database with data from a given state dump; the dump must not be older than
 * the state in storage.
 *
 * @param this - RaidenStorage constructor, as static factory param
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
export async function replaceDatabase(
  this: RaidenStorageConstructor,
  data: Iterable<any> | AsyncIterable<any>,
  name: string,
  migrations: Migrations = defaultMigrations,
  cleanOld = false,
): ReturnType<typeof migrateDatabase> {
  const iter = isAsyncIterable(data) ? data[Symbol.asyncIterator]() : data[Symbol.iterator]();
  const first = await iter.next();
  assert(!first.done && first.value._id === '_meta', 'first yielded value must be "_meta"');
  const meta: RaidenDatabaseMeta = first.value;

  // ensure db's current version in store is older than replacement
  for (let version = latestVersion(migrations); version >= meta.version; --version) {
    const dbName = `${name}_${version}`;
    const storage = await storageExists.call(this, dbName);
    if (!storage) continue;
    const dbMeta = await databaseMeta(storage);
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
    await storage.destroy();
  }

  // iterate and insert entries into db for replacement's version
  const dbName = `${name}_${meta.version}`;
  const storage = await makeStorage.call(this, dbName);
  let next = await iter.next();
  while (!next.done) {
    const doc = next.value;
    if ('_rev' in doc) delete doc['_rev'];
    [next] = await Promise.all([iter.next(), storage.put(doc)]);
  }
  await storage.close();

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
 * @param storage - Database to dump
 * @param opts - Options
 * @param opts.batch - Size of batches to fetch and yield
 * @returns Generator of documents
 */
export async function* dumpDatabase(
  storage: RaidenStorage,
  { batch = 10 }: { batch?: number } = {},
) {
  let changed: string | undefined;
  const feed = storage.changes({ since: 'now', live: true });
  feed.on('change', ({ id }) => (changed = id));
  try {
    yield await databaseMeta(storage);
    let startkey = 'a';
    while (true) {
      const results = await storage.allDocs({
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

async function reopenStorage(storage: RaidenStorage): Promise<RaidenStorage> {
  return makeStorage.call(storage.constructor, storage.name);
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
  let storage = db.storage;
  const { log } = storage.constructor.__defaults;
  let shouldCloseAfter = false;
  for (let _try = 10; _try > 0; --_try) {
    try {
      const result = [];
      for await (const doc of dumpDatabase(storage, opts)) {
        result.push(doc);
      }
      if (shouldCloseAfter) await storage.close(); // on success
      return result;
    } catch (e) {
      if (e.message?.includes?.('database is closed')) {
        shouldCloseAfter = true;
        storage = await reopenStorage(storage);
      }
      log?.warn?.('Restarting dump because', e);
    }
  }
  throw new Error('Could not dump database');
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
          // for legacy migrations, consider closed==settled, so we don't load these channels
          ...(transfer.channelClosed ? { channelSettled: transfer.channelClosed } : {}),
        };
      }
    } else {
      yield { _id: statePrefix + key, value };
    }
  }
}
