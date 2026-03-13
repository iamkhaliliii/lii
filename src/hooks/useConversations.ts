"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Conversation } from "@/types";
import {
  getConversations,
  saveConversation,
  deleteConversation as deleteConversationDB,
  migrateHistoryToConversations,
} from "@/lib/storage";
import { generateId } from "@/lib/utils";

const MIGRATION_KEY = "lii-chat-migrated";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  const load = useCallback(async (search?: string) => {
    try {
      let data = await getConversations();
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.lastMessagePreview.toLowerCase().includes(q)
        );
      }
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run migration once, then load
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      try {
        const migrated = localStorage.getItem(MIGRATION_KEY);
        if (!migrated) {
          const count = await migrateHistoryToConversations();
          if (count > 0) {
            console.log(`Migrated ${count} history entries to conversations`);
          }
          localStorage.setItem(MIGRATION_KEY, "1");
        }
      } catch (err) {
        console.error("Migration failed:", err);
      }
      await load();
    })();
  }, [load]);

  const create = useCallback(
    async (contactId?: string, title?: string) => {
      const conv: Conversation = {
        id: generateId(),
        title: title || "New Chat",
        contactId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
        lastMessagePreview: "",
      };
      await saveConversation(conv);
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      return conv;
    },
    []
  );

  const select = useCallback((id: string | null) => {
    setActiveId(id);
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await deleteConversationDB(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
      }
    },
    [activeId]
  );

  const updateConversation = useCallback(
    async (updated: Conversation) => {
      await saveConversation(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    },
    []
  );

  // Refresh a single conversation in the list (after messages change)
  const refreshConversation = useCallback(
    async (id: string) => {
      const all = await getConversations();
      const updated = all.find((c) => c.id === id);
      if (updated) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => b.updatedAt - a.updatedAt)
        );
      }
    },
    []
  );

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  return {
    conversations,
    activeId,
    activeConversation,
    loading,
    load,
    create,
    select,
    remove,
    updateConversation,
    refreshConversation,
  };
}
