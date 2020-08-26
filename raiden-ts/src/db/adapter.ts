import PouchDB from 'pouchdb';

let defaultAdapter: string;

/**
 * @returns Default adapter PouchDB option
 */
export default async function getDefaultPouchAdapter(): Promise<string> {
  // default RxDB adapters, using dynamic imports (module=ESNext|CommonJS)
  if (defaultAdapter) return defaultAdapter;
  if (globalThis.location?.href) {
    // browser
    const { default: adapterPlugin } = await import('pouchdb-adapter-indexeddb');
    PouchDB.plugin(adapterPlugin);
    defaultAdapter = 'indexeddb';
  } else {
    // node
    const { default: adapterPlugin } = await import('pouchdb-adapter-leveldb');
    PouchDB.plugin(adapterPlugin);
    defaultAdapter = 'leveldb';
  }
  return defaultAdapter;
}
