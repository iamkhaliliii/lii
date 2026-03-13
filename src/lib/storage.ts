import { openDB, type IDBPDatabase } from "idb";
import { HistoryEntry, Contact, ContactMessage, Conversation, ChatMessage } from "@/types";
import { isTauri } from "@/lib/auth";

// ========================
// IndexedDB (web mode)
// ========================

const DB_NAME = "lii-db";
const DB_VERSION = 3;

const TRANSLATIONS = "translations";
const CONTACTS = "contacts";
const CONTACT_MESSAGES = "contactMessages";
const CONVERSATIONS = "conversations";
const CHAT_MESSAGES = "chatMessages";

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore(TRANSLATIONS, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }
      if (oldVersion < 2) {
        const contactsStore = db.createObjectStore(CONTACTS, {
          keyPath: "id",
        });
        contactsStore.createIndex("name", "name");
        contactsStore.createIndex("lastInteraction", "lastInteraction");

        const msgStore = db.createObjectStore(CONTACT_MESSAGES, {
          keyPath: "id",
        });
        msgStore.createIndex("contactId", "contactId");
        msgStore.createIndex("timestamp", "timestamp");
      }
      if (oldVersion < 3) {
        const convStore = db.createObjectStore(CONVERSATIONS, { keyPath: "id" });
        convStore.createIndex("updatedAt", "updatedAt");

        const chatStore = db.createObjectStore(CHAT_MESSAGES, { keyPath: "id" });
        chatStore.createIndex("conversationId", "conversationId");
        chatStore.createIndex("timestamp", "timestamp");
      }
    },
  });
}

// ========================
// Tauri Store (desktop mode)
// ========================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const storeCache: Record<string, any> = {};

async function getTauriStore(name: string) {
  if (!storeCache[name]) {
    const { load } = await import("@tauri-apps/plugin-store");
    storeCache[name] = await load(name, { defaults: {}, autoSave: false });
  }
  return storeCache[name];
}

// ========================
// Translations (History)
// ========================

export async function saveTranslation(entry: HistoryEntry): Promise<void> {
  if (isTauri()) {
    const store = await getTauriStore("translations.json");
    await store.set(entry.id, entry);
    await store.save();
    return;
  }
  const db = await getDB();
  await db.put(TRANSLATIONS, entry);
}

export async function getHistory(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<HistoryEntry[]> {
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  const search = options?.search?.toLowerCase();

  if (isTauri()) {
    const store = await getTauriStore("translations.json");
    const allEntries: [string, HistoryEntry][] = await store.entries();
    let entries = allEntries.map(([, v]) => v);

    if (search) {
      entries = entries.filter(
        (e) =>
          e.originalText.toLowerCase().includes(search) ||
          e.translatedText.toLowerCase().includes(search)
      );
    }

    entries.sort((a, b) => b.timestamp - a.timestamp);
    return entries.slice(offset, offset + limit);
  }

  const db = await getDB();
  const tx = db.transaction(TRANSLATIONS, "readonly");
  const index = tx.store.index("timestamp");
  const entries: HistoryEntry[] = [];

  let cursor = await index.openCursor(null, "prev");
  let skipped = 0;

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
  if (isTauri()) {
    const store = await getTauriStore("translations.json");
    await store.delete(id);
    await store.save();
    return;
  }
  const db = await getDB();
  await db.delete(TRANSLATIONS, id);
}

export async function toggleStar(id: string): Promise<void> {
  if (isTauri()) {
    const store = await getTauriStore("translations.json");
    const entry = await store.get(id);
    if (entry) {
      entry.starred = !entry.starred;
      await store.set(id, entry);
      await store.save();
    }
    return;
  }
  const db = await getDB();
  const entry = await db.get(TRANSLATIONS, id);
  if (entry) {
    entry.starred = !entry.starred;
    await db.put(TRANSLATIONS, entry);
  }
}

export async function clearHistory(): Promise<void> {
  if (isTauri()) {
    const store = await getTauriStore("translations.json");
    await store.clear();
    await store.save();
    return;
  }
  const db = await getDB();
  await db.clear(TRANSLATIONS);
}

export async function exportHistory(): Promise<string> {
  if (isTauri()) {
    const store = await getTauriStore("translations.json");
    const allEntries: [string, HistoryEntry][] = await store.entries();
    return JSON.stringify(
      allEntries.map(([, v]) => v),
      null,
      2
    );
  }
  const db = await getDB();
  const all = await db.getAll(TRANSLATIONS);
  return JSON.stringify(all, null, 2);
}

export async function importHistory(json: string): Promise<number> {
  const entries = JSON.parse(json) as HistoryEntry[];
  if (isTauri()) {
    const store = await getTauriStore("translations.json");
    for (const entry of entries) {
      await store.set(entry.id, entry);
    }
    await store.save();
    return entries.length;
  }
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
  if (isTauri()) {
    const store = await getTauriStore("contacts.json");
    await store.set(contact.id, contact);
    await store.save();
    return;
  }
  const db = await getDB();
  await db.put(CONTACTS, contact);
}

export async function getContacts(): Promise<Contact[]> {
  if (isTauri()) {
    const store = await getTauriStore("contacts.json");
    const all: [string, Contact][] = await store.entries();
    const contacts = all.map(([, v]) => v);
    contacts.sort((a, b) => b.lastInteraction - a.lastInteraction);
    return contacts;
  }
  const db = await getDB();
  const tx = db.transaction(CONTACTS, "readonly");
  const index = tx.store.index("lastInteraction");
  const contacts: Contact[] = [];

  let cursor = await index.openCursor(null, "prev");
  while (cursor) {
    contacts.push(cursor.value as Contact);
    cursor = await cursor.continue();
  }

  return contacts;
}

export async function getContact(id: string): Promise<Contact | undefined> {
  if (isTauri()) {
    const store = await getTauriStore("contacts.json");
    return await store.get(id);
  }
  const db = await getDB();
  return db.get(CONTACTS, id);
}

export async function deleteContact(id: string): Promise<void> {
  if (isTauri()) {
    const contactStore = await getTauriStore("contacts.json");
    await contactStore.delete(id);
    await contactStore.save();

    const msgStore = await getTauriStore("contact-messages.json");
    const all: [string, ContactMessage][] = await msgStore.entries();
    for (const [key, msg] of all) {
      if (msg.contactId === id) {
        await msgStore.delete(key);
      }
    }
    await msgStore.save();
    return;
  }
  const db = await getDB();

  await db.delete(CONTACTS, id);

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
  if (isTauri()) {
    const msgStore = await getTauriStore("contact-messages.json");
    await msgStore.set(msg.id, msg);
    await msgStore.save();

    const contactStore = await getTauriStore("contacts.json");
    const contact: Contact | undefined = await contactStore.get(msg.contactId);
    if (contact) {
      contact.lastInteraction = msg.timestamp;
      contact.messageCount = (contact.messageCount || 0) + 1;
      await contactStore.set(contact.id, contact);
      await contactStore.save();
    }
    return;
  }
  const db = await getDB();
  await db.put(CONTACT_MESSAGES, msg);

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
  if (isTauri()) {
    const store = await getTauriStore("contact-messages.json");
    const all: [string, ContactMessage][] = await store.entries();
    const filtered = all
      .map(([, v]) => v)
      .filter((m) => m.contactId === contactId);
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    return filtered.slice(0, count).reverse();
  }
  const db = await getDB();
  const tx = db.transaction(CONTACT_MESSAGES, "readonly");
  const index = tx.store.index("contactId");
  const messages: ContactMessage[] = [];

  let cursor = await index.openCursor(IDBKeyRange.only(contactId));
  while (cursor) {
    messages.push(cursor.value as ContactMessage);
    cursor = await cursor.continue();
  }

  messages.sort((a, b) => b.timestamp - a.timestamp);
  return messages.slice(0, count).reverse();
}

export async function getContactMessageCount(
  contactId: string
): Promise<number> {
  if (isTauri()) {
    const store = await getTauriStore("contact-messages.json");
    const all: [string, ContactMessage][] = await store.entries();
    return all.filter(([, m]) => m.contactId === contactId).length;
  }
  const db = await getDB();
  const tx = db.transaction(CONTACT_MESSAGES, "readonly");
  const index = tx.store.index("contactId");
  return index.count(IDBKeyRange.only(contactId));
}

// ========================
// Conversations
// ========================

export async function saveConversation(conv: Conversation): Promise<void> {
  if (isTauri()) {
    const store = await getTauriStore("conversations.json");
    await store.set(conv.id, conv);
    await store.save();
    return;
  }
  const db = await getDB();
  await db.put(CONVERSATIONS, conv);
}

export async function getConversations(): Promise<Conversation[]> {
  if (isTauri()) {
    const store = await getTauriStore("conversations.json");
    const all: [string, Conversation][] = await store.entries();
    const convs = all.map(([, v]) => v);
    convs.sort((a, b) => b.updatedAt - a.updatedAt);
    return convs;
  }
  const db = await getDB();
  const tx = db.transaction(CONVERSATIONS, "readonly");
  const index = tx.store.index("updatedAt");
  const convs: Conversation[] = [];

  let cursor = await index.openCursor(null, "prev");
  while (cursor) {
    convs.push(cursor.value as Conversation);
    cursor = await cursor.continue();
  }
  return convs;
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  if (isTauri()) {
    const store = await getTauriStore("conversations.json");
    return await store.get(id);
  }
  const db = await getDB();
  return db.get(CONVERSATIONS, id);
}

export async function deleteConversation(id: string): Promise<void> {
  if (isTauri()) {
    const convStore = await getTauriStore("conversations.json");
    await convStore.delete(id);
    await convStore.save();

    const msgStore = await getTauriStore("chat-messages.json");
    const all: [string, ChatMessage][] = await msgStore.entries();
    for (const [key, msg] of all) {
      if (msg.conversationId === id) {
        await msgStore.delete(key);
      }
    }
    await msgStore.save();
    return;
  }
  const db = await getDB();
  await db.delete(CONVERSATIONS, id);

  const tx = db.transaction(CHAT_MESSAGES, "readwrite");
  const index = tx.store.index("conversationId");
  let cursor = await index.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

// ========================
// Chat Messages
// ========================

export async function saveChatMessage(msg: ChatMessage): Promise<void> {
  if (isTauri()) {
    const msgStore = await getTauriStore("chat-messages.json");
    await msgStore.set(msg.id, msg);
    await msgStore.save();

    // Update parent conversation
    const convStore = await getTauriStore("conversations.json");
    const conv: Conversation | undefined = await convStore.get(msg.conversationId);
    if (conv) {
      conv.updatedAt = msg.timestamp;
      conv.messageCount = (conv.messageCount || 0) + 1;
      conv.lastMessagePreview = msg.translatedText
        ? msg.translatedText.slice(0, 80)
        : msg.originalText.slice(0, 80);
      await convStore.set(conv.id, conv);
      await convStore.save();
    }
    return;
  }
  const db = await getDB();
  await db.put(CHAT_MESSAGES, msg);

  // Update parent conversation
  const conv = await db.get(CONVERSATIONS, msg.conversationId);
  if (conv) {
    conv.updatedAt = msg.timestamp;
    conv.messageCount = (conv.messageCount || 0) + 1;
    conv.lastMessagePreview = msg.translatedText
      ? msg.translatedText.slice(0, 80)
      : msg.originalText.slice(0, 80);
    await db.put(CONVERSATIONS, conv);
  }
}

export async function getChatMessages(conversationId: string): Promise<ChatMessage[]> {
  if (isTauri()) {
    const store = await getTauriStore("chat-messages.json");
    const all: [string, ChatMessage][] = await store.entries();
    const filtered = all
      .map(([, v]) => v)
      .filter((m) => m.conversationId === conversationId);
    filtered.sort((a, b) => a.timestamp - b.timestamp);
    return filtered;
  }
  const db = await getDB();
  const tx = db.transaction(CHAT_MESSAGES, "readonly");
  const index = tx.store.index("conversationId");
  const messages: ChatMessage[] = [];

  let cursor = await index.openCursor(IDBKeyRange.only(conversationId));
  while (cursor) {
    messages.push(cursor.value as ChatMessage);
    cursor = await cursor.continue();
  }
  messages.sort((a, b) => a.timestamp - b.timestamp);
  return messages;
}

export async function deleteChatMessage(id: string): Promise<void> {
  if (isTauri()) {
    const store = await getTauriStore("chat-messages.json");
    await store.delete(id);
    await store.save();
    return;
  }
  const db = await getDB();
  await db.delete(CHAT_MESSAGES, id);
}

// ========================
// Migration: History → Conversations
// ========================

export async function migrateHistoryToConversations(): Promise<number> {
  const entries = await getHistory({ limit: 9999 });
  if (entries.length === 0) return 0;

  // Group by contactId (or "no-contact" bucket)
  const groups: Record<string, HistoryEntry[]> = {};
  for (const entry of entries) {
    const key = entry.contactId || "__no_contact__";
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }

  let migrated = 0;

  for (const [key, groupEntries] of Object.entries(groups)) {
    // Sort oldest first
    groupEntries.sort((a, b) => a.timestamp - b.timestamp);

    const convId = `migrated-${key === "__no_contact__" ? "general" : key}-${Date.now()}`;
    const firstEntry = groupEntries[0];
    const lastEntry = groupEntries[groupEntries.length - 1];

    const conv: Conversation = {
      id: convId,
      title: key === "__no_contact__" ? "General" : firstEntry.originalText.slice(0, 40),
      contactId: key === "__no_contact__" ? undefined : key,
      createdAt: firstEntry.timestamp,
      updatedAt: lastEntry.timestamp,
      messageCount: groupEntries.length,
      lastMessagePreview: lastEntry.translatedText?.slice(0, 80) || "",
    };

    await saveConversation(conv);

    for (const entry of groupEntries) {
      const chatMsg: ChatMessage = {
        id: `chat-${entry.id}`,
        conversationId: convId,
        contactId: entry.contactId,
        direction: "incoming",
        originalText: entry.originalText,
        translatedText: entry.translatedText,
        tone: entry.tone,
        suggestedResponses: entry.suggestedResponses,
        needsResponse: entry.needsResponse,
        source: entry.source,
        provider: entry.provider,
        model: entry.model,
        timestamp: entry.timestamp,
      };
      await saveChatMessage(chatMsg);
      migrated++;
    }
  }

  return migrated;
}
