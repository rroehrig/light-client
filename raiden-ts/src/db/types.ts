import type { BigNumber, BigNumberish } from 'ethers/utils';
import type logging from 'loglevel';
import type Loki from 'lokijs';

import { Channel } from '../channels/state';
import type { TransferState } from '../transfers/state';
import { Address } from '../utils/types';

// type helper to recursively map values assignable to BigNumber as BigNumberish;
// to ensure a [de]serialized BigNumber from db (`{_hex:"0x"}`) isn't used as BigNumber directly
// and should be decoded first (unless somewhere accepting BigNumberish, e.g. BigNumber methods)
type AsBigNumberish<T> = T extends BigNumber
  ? BigNumberish
  : T extends boolean | string | number | null | symbol
  ? T
  : { [K in keyof T]: AsBigNumberish<T[K]> };

export interface TransferStateish extends AsBigNumberish<TransferState> {
  _rev: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StateMember = { _id: string; value: any };

export type Migrations = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [version: number]: (doc: any, db: RaidenStorage) => Promise<any[]>;
};

export interface RaidenDatabaseMeta {
  _id: '_meta';
  version: number;
  network: number;
  registry: Address;
  address: Address;
  blockNumber: number;
}

export type RaidenDatabaseOptions = {
  log?: logging.Logger;
} & (
  | PouchDB.Configuration.LocalDatabaseConfiguration
  | PouchDB.Configuration.RemoteDatabaseConfiguration
);

export interface RaidenStorage extends PouchDB.Database {
  constructor: RaidenStorageConstructor;
}

export type RaidenStorageConstructor = (new (
  name?: string,
  options?:
    | PouchDB.Configuration.LocalDatabaseConfiguration
    | PouchDB.Configuration.RemoteDatabaseConfiguration,
) => RaidenStorage) & { __defaults: RaidenDatabaseOptions };

export interface RaidenDatabase {
  storage: RaidenStorage;
  db: Loki;
  state: Loki.Collection<StateMember>;
  channels: Loki.Collection<Channel>;
  transfers: Loki.Collection<TransferState>;
  storageKeys: Set<string>;
}
