/**
 * Browser file store (IndexedDB). Holds the raw bytes of datasets, untouched,
 * as Blobs. This is local to one browser profile: it is not shared with other
 * users or devices. For the shared version, replace these functions with
 * calls to managed object storage; Dataset.fileKey stays the reference.
 */
const DB = "tp-files";
const STORE = "blobs";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("This browser does not support local file storage."));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open the browser file store."));
    req.onblocked = () => reject(new Error("The browser file store is blocked by another tab."));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const r = run(t.objectStore(STORE));
        let out: T;
        r.onsuccess = () => {
          out = r.result;
        };
        t.oncomplete = () => {
          db.close();
          resolve(out);
        };
        t.onerror = () => {
          db.close();
          reject(t.error ?? new Error("Browser storage error."));
        };
        t.onabort = () => {
          db.close();
          const e = t.error;
          reject(e?.name === "QuotaExceededError" ? new Error("Browser storage is full.") : (e ?? new Error("Browser storage was interrupted.")));
        };
      }),
  );
}

export const putFile = (key: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, key)).then(() => undefined);
export const getFile = (key: string) => tx<Blob | undefined>("readonly", (s) => s.get(key) as IDBRequest<Blob | undefined>);
export const deleteFile = (key: string) => tx("readwrite", (s) => s.delete(key)).then(() => undefined);

/** Free space the browser is willing to give this site, if it reports it. */
export async function freeSpace(): Promise<number | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    if (e?.quota == null || e.usage == null) return null;
    return e.quota - e.usage;
  } catch {
    return null;
  }
}

export async function sha256Hex(blob: Blob): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) return "";
  const buf = await blob.arrayBuffer();
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
  return Array.from(h, (b) => b.toString(16).padStart(2, "0")).join("");
}
