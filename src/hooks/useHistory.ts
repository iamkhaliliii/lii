"use client";
import { useState, useCallback } from "react";
import { HistoryEntry } from "@/types";
import {
  getHistory as getHistoryDB,
  saveTranslation,
  deleteTranslation,
  toggleStar,
  clearHistory as clearHistoryDB,
} from "@/lib/storage";

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const data = await getHistoryDB({ search });
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (entry: HistoryEntry) => {
    await saveTranslation(entry);
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await deleteTranslation(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    []
  );

  const star = useCallback(async (id: string) => {
    await toggleStar(id);
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e))
    );
  }, []);

  const clear = useCallback(async () => {
    await clearHistoryDB();
    setEntries([]);
  }, []);

  return { entries, loading, load, save, remove, star, clear };
}
