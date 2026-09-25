// Artwork uploaded in the viewer is kept in this browser (IndexedDB) so it
// survives a reload. It never leaves the device: for everyone to see a file,
// it still has to go in /public/assets. Every call fails soft (private
// windows, blocked storage): the viewer then just forgets on reload.
const DB = 'opf27-sticker-stage'; // earlier project name, kept so saved uploads survive
const STORE = 'artwork';

let dbPromise;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(mode, fn) {
  try {
    const d = await db();
    return await new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req?.result ?? null);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return null;
  }
}

// { blob, name } or null
export const loadArt = (key) => run('readonly', (s) => s.get(key));
export const saveArt = (key, file) => run('readwrite', (s) => s.put({ blob: file, name: file.name }, key));
export const clearArt = (key) => run('readwrite', (s) => s.delete(key));
