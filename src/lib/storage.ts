import { openDB, type IDBPDatabase } from "idb";
import { HistoryEntry, Contact, ContactMessage } from "@/types";

const DB_NAME = "lii-db";
const DB_VERSION = 2;

// Store names
const TRANSLATIONS = "translations";
const CONTACTS = "contacts";
const CONTACT_MESSAGES = "contactMessages";

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // v1: translations store
      if (oldVersion < 1) {
        const store = db.createObjectStore(TRANSLATIONS, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }

      // v2: contacts + contactMessages stores
      if (oldVersion < 2) {
        // Contacts store
        const contactsStore = db.createObjectStore(CONTACTS, {
          keyPath: "id",
        });
        contactsStore.createIndex("name", "name");
        contactsStore.createIndex("lastInteraction", "lastInteraction");

        // Contact messages store
        const msgStore = db.createObjectStore(CONTACT_MESSAGES, {
          keyPath: "id",
        });
        msgStore.createIndex("contactId", "contactId");
        msgStore.createIndex("timestamp", "timestamp");
      }
    },
  });
}

// ========================
// Translations (existing)
// ========================

export async function saveTranslation(entry: HistoryEntry): Promise<void> {
  const db = await getDB();
  await db.put(TRANSLATIONS, entry);
}

export async function getHistory(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<HistoryEntry[]> {
  const db = await getDB();
  const tx = db.transaction(TRANSLATIONS, "readonly");
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
  await db.delete(TRANSLATIONS, id);
}

export async function toggleStar(id: string): Promise<void> {
  const db = await getDB();
  const entry = await db.get(TRANSLATIONS, id);
  if (entry) {
    entry.starred = !entry.starred;
    await db.put(TRANSLATIONS, entry);
  }
}

export async function clearHistory(): Promise<void> {
  const db = await getDB();
  await db.clear(TRANSLATIONS);
}

export async function exportHistory(): Promise<string> {
  const db = await getDB();
  const all = await db.getAll(TRANSLATIONS);
  return JSON.stringify(all, null, 2);
}

export async function importHistory(json: string): Promise<number> {
  const entries = JSON.parse(json) as HistoryEntry[];
  const db = await getDB();
  const tx = db.transaction(TRANSLATIONS, "readwrite");
  for (const entry of entries) {
    await tx.store.put(entry);
  }
  await tx.done;
  return entries.length;
}

// ========================
// Contacts
// ========================

export async function saveContact(contact: Contact): Promise<void> {
  const db = await getDB();
  await db.put(CONTACTS, contact);
}

export async function getContacts(): Promise<Contact[]> {
  const db = await getDB();
  const tx = db.transaction(CONTACTS, "readonly");
  const index = tx.store.index("lastInteraction");
  const contacts: Contact[] = [];

  let cursor = await index.openCursor(null, "prev"); // newest first
  while (cursor) {
    contacts.push(cursor.value as Contact);
    cursor = await cursor.continue();
  }

  return contacts;
}

export async function getContact(id: string): Promise<Contact | undefined> {
  const db = await getDB();
  return db.get(CONTACTS, id);
}

export async function deleteContact(id: string): Promise<void> {
  const db = await getDB();

  // Delete contact
  await db.delete(CONTACTS, id);

  // Delete all contact messages for this contact
  const tx = db.transaction(CONTACT_MESSAGES, "readwrite");
  const index = tx.store.index("contactId");
  let cursor = await index.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function searchContacts(query: string): Promise<Contact[]> {
  const contacts = await getContacts();
  const q = query.toLowerCase();
  return contacts.filter((c) => c.name.toLowerCase().includes(q));
}

// ========================
// Contact Messages
// ========================

export async function saveContactMessage(
  msg: ContactMessage
): Promise<void> {
  const db = await getDB();
  await db.put(CONTACT_MESSAGES, msg);

  // Update contact's lastInteraction and messageCount
  const contact = await db.get(CONTACTS, msg.contactId);
  if (contact) {
    contact.lastInteraction = msg.timestamp;
    contact.messageCount = (contact.messageCount || 0) + 1;
    await db.put(CONTACTS, contact);
  }
}

export async function getRecentContactMessages(
  contactId: string,
  count: number = 10
): Promise<ContactMessage[]> {
  const db = await getDB();
  const tx = db.transaction(CONTACT_MESSAGES, "readonly");
  const index = tx.store.index("contactId");
  const messages: ContactMessage[] = [];

  let cursor = await index.openCursor(IDBKeyRange.only(contactId));
  while (cursor) {
    messages.push(cursor.value as ContactMessage);
    cursor = await cursor.continue();
  }

  // Sort by timestamp desc, take count, then reverse to chronological
  messages.sort((a, b) => b.timestamp - a.timestamp);
  return messages.slice(0, count).reverse();
}

export async function getContactMessageCount(
  contactId: string
): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(CONTACT_MESSAGES, "readonly");
  const index = tx.store.index("contactId");
  return index.count(IDBKeyRange.only(contactId));
}
