import { openDB, type IDBPDatabase } from "idb";
import { HistoryEntry } from "@/types";

const DB_NAME = "lii-db";
const STORE_NAME = "translations";
const DB_VERSION = 1;

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }
    },
  });
}

export async function saveTranslation(entry: HistoryEntry): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, entry);
}

export async function getHistory(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<HistoryEntry[]> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const index = tx.store.index("timestamp");
  const entries: HistoryEntry[] = [];

  let cursor = await index.openCursor(null, "prev");
  let skipped = 0;
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  const search = options?.search?.toLowerCase();

  while (cursor) {
    const entry = cursor.value as HistoryEntry;
    const matches =
      !search ||
      entry.originalText.toLowerCase().includes(search) ||
      entry.translatedText.toLowerCase().includes(search);

    if (matches) {
      if (skipped < offset) {
        skipped++;
      } else {
        entries.push(entry);
        if (entries.length >= limit) break;
      }
    }
    cursor = await cursor.continue();
  }

  return entries;
}

export async function deleteTranslation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function toggleStar(id: string): Promise<void> {
  const db = await getDB();
  const entry = await db.get(STORE_NAME, id);
  if (entry) {
    entry.starred = !entry.starred;
    await db.put(STORE_NAME, entry);
  }
}

export async function clearHistory(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function exportHistory(): Promise<string> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return JSON.stringify(all, null, 2);
}

export async function importHistory(json: string): Promise<number> {
  const entries = JSON.parse(json) as HistoryEntry[];
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  for (const entry of entries) {
    await tx.store.put(entry);
  }
  await tx.done;
  return entries.length;
}
