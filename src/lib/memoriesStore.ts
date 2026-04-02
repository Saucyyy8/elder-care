export interface MemoryItem {
  id: string;
  imageData: string;
  location: string;
  date: string;
  note: string;
}

const LS_KEY = "guardianFamilyMemories";
const DB_NAME = "guardian-companion-db";
const STORE_NAME = "app-state";
const MEMORIES_KEY = "memories";

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const idbRead = async (): Promise<MemoryItem[]> => {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(MEMORIES_KEY);

    req.onsuccess = () => {
      const value = req.result as MemoryItem[] | undefined;
      resolve(Array.isArray(value) ? value : []);
    };
    req.onerror = () => reject(req.error);
  });
};

const idbWrite = async (items: MemoryItem[]) => {
  const db = await openDb();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(items, MEMORIES_KEY);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const loadMemories = async (): Promise<MemoryItem[]> => {
  try {
    if (typeof indexedDB !== "undefined") {
      return await idbRead();
    }
  } catch {
    // Fall through to localStorage fallback.
  }

  const raw = localStorage.getItem(LS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as MemoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveMemories = async (items: MemoryItem[]) => {
  let wroteToIdb = false;

  try {
    if (typeof indexedDB !== "undefined") {
      await idbWrite(items);
      wroteToIdb = true;
    }
  } catch {
    wroteToIdb = false;
  }

  if (!wroteToIdb) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }
};
