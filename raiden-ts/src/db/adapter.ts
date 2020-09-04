import PouchDB from 'pouchdb';
import Loki from 'lokijs';
import uniq from 'lodash/uniq';

import { TransferState } from '../transfers/state';
import { Channel } from '../channels/state';
import { decode } from '../utils/types';
import { RaidenStorage, StateMember } from './types';

let defaultPouchAdapter: string;

/**
 * @param prefix - Prefix to query for
 * @param descending - Wether to swap start & endkey for reverse reverse search
 * @returns allDocs's options to fetch all documents which keys start with prefix
 */
function byPrefix(prefix: string, descending = false) {
  const start = prefix;
  const end = prefix + '\ufff0';
  return !descending
    ? { startkey: start, endkey: end }
    : { startkey: end, endkey: start, descending };
}

/**
 * @returns Default adapter PouchDB option
 */
export async function getDefaultPouchAdapter(): Promise<string> {
  // default RxDB adapters, using dynamic imports (module=ESNext|CommonJS)
  if (defaultPouchAdapter) return defaultPouchAdapter;
  if (globalThis.location?.href) {
    // browser
    const { default: adapterPlugin } = await import('pouchdb-adapter-indexeddb');
    PouchDB.plugin(adapterPlugin);
    defaultPouchAdapter = 'indexeddb';
  } else {
    // node
    const { default: adapterPlugin } = await import('pouchdb-adapter-leveldb');
    PouchDB.plugin(adapterPlugin);
    defaultPouchAdapter = 'leveldb';
  }
  return defaultPouchAdapter;
}

const statePrefix = 'state.';
const channelsPrefix = 'channels.';

export class LokiRaidenAdapter {
  readonly mode = 'incremental';

  constructor(private storage: RaidenStorage) {}

  get log() {
    return this.storage.constructor.__defaults.log;
  }

  private async _loadState(state: Loki.Collection<StateMember>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await this.storage.allDocs<StateMember>({
      include_docs: true,
      ...byPrefix(statePrefix),
    });
    // _id on pouch is prefixed, so we clean it for loki
    for (const { doc } of results.rows)
      state.insert({ ...doc!, _id: doc!._id.substr(statePrefix.length) });
  }

  private async _loadChannels(channels: Loki.Collection<Channel>) {
    const results = await this.storage.allDocs<Channel>({
      include_docs: true,
      ...byPrefix(channelsPrefix),
    });
    for (const { doc } of results.rows) {
      const decoded = decode(Channel, { ...doc, _id: doc!._id.substr(channelsPrefix.length) });
      channels.insert(decoded);
    }
  }

  private async _loadTransfers(transfers: Loki.Collection<TransferState>) {
    // load all and only *pending* transfers, completed ones are left in the storage
    const results = await this.storage.find({
      selector: {
        direction: { $exists: true },
        unlockProcessed: { $exists: false },
        expiredProcessed: { $exists: false },
        channelSettled: { $exists: false },
      },
    });
    if (results.warning && this.log)
      this.log.warn(results.warning, 'LokiRaidenAdapter.loadDatabase');
    for (const doc of results.docs) {
      transfers.insert(decode(TransferState, doc));
    }
  }

  async loadDatabase(name: string, callback: (res: Error | Loki) => void): Promise<void> {
    const db = new Loki(name, { adapter: new Loki.LokiMemoryAdapter() });
    const state = db.addCollection<StateMember>('state', { unique: ['_id'] });
    const channels = db.addCollection<Channel>('channels', { unique: ['_id'] });
    const transfers = db.addCollection<TransferState>('transfers', {
      unique: ['_id'],
      indices: ['direction', 'secrethash', 'partner', 'channel'],
    });

    try {
      await Promise.all([
        this._loadState(state),
        this._loadChannels(channels),
        this._loadTransfers(transfers),
      ]);
    } catch (err) {
      callback(err);
      throw err;
    }
    callback(db);
  }

  private async _saveOnPouchDocs<T extends { _id: string }>(
    coll: Loki.Collection<T>,
    mapId?: (_id: string) => string,
  ): Promise<void> {
    const collection = coll as Loki.Collection<T> & { dirtyIds: number[] };
    const dirtyIds = uniq(collection.dirtyIds);
    let dirtyDocs = dirtyIds.map((id) => {
      const { $loki: _, meta: _2, ...doc } = collection.get(id);
      if (mapId) doc._id = mapId(doc._id);
      return (doc as unknown) as T;
    });
    // perform bulk upserts on dirty docs
    while (dirtyDocs.length) {
      const keys = dirtyDocs.map((doc) => doc._id);
      // fetch previous revs for each doc from storage
      const prevRevs = await this.storage.allDocs({ keys });
      const getRev = (doc: T) => {
        const prev = prevRevs.rows.find((r) => r.id === doc._id);
        if (prev?.value?.deleted) return { _rev: prev.value.rev, deleted: false };
        else if (prev && !('error' in prev)) return { _rev: prev.value.rev };
      };
      const res = await this.storage.bulkDocs(
        dirtyDocs.map((doc) => ({ ...doc, ...getRev(doc) })),
      );
      const errored = new Set(res.filter((r) => 'error' in r && r.error).map((r) => r.id!));
      // set dirtyDocs to retry the errored ones; will break if empty
      dirtyDocs = dirtyDocs.filter((doc) => errored.has(doc._id));
    }
  }

  async saveDatabase(
    _name: string,
    loki: Loki,
    callback: (err?: Error | null | undefined) => void,
  ): Promise<void> {
    try {
      await Promise.all(
        loki.collections.map(async (coll) => {
          if (coll.name === 'state') {
            return this._saveOnPouchDocs(
              coll as Loki.Collection<StateMember>,
              (_id) => statePrefix + _id,
            );
          } else if (coll.name === 'channels') {
            return this._saveOnPouchDocs(
              coll as Loki.Collection<Channel>,
              (_id) => channelsPrefix + _id,
            );
          } else if (coll.name === 'transfers') {
            return this._saveOnPouchDocs(coll as Loki.Collection<TransferState>);
          }
        }),
      );
    } catch (err) {
      callback(err);
      throw err;
    }
    callback(null);
  }
}
