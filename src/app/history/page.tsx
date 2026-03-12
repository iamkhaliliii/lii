"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useHistory } from "@/hooks/useHistory";
import { Search, Star, Trash2, Copy, Check } from "lucide-react";

export default function HistoryPage() {
  const { entries, loading, load, remove, star } = useHistory();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Translation History</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* List */}
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            {search ? "No results found" : "No translations saved yet"}
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p
                    dir="ltr"
                    className="flex-1 text-sm leading-relaxed text-muted line-clamp-2"
                  >
                    {entry.originalText}
                  </p>
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <p className="rtl mb-3 text-sm leading-relaxed" style={{ fontFamily: "var(--font-vazirmatn), system-ui, sans-serif" }}>
                  {entry.translatedText}
                </p>

                {entry.tone && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {entry.tone.formality}
                    </span>
                    {entry.tone.likelySender && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {entry.tone.likelySender}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(entry.translatedText, entry.id)}
                    className="rounded p-1.5 text-muted hover:bg-accent hover:text-foreground"
                  >
                    {copiedId === entry.id ? (
                      <Check size={14} className="text-success" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => star(entry.id)}
                    className="rounded p-1.5 text-muted hover:bg-accent hover:text-foreground"
                  >
                    <Star
                      size={14}
                      className={
                        entry.starred
                          ? "fill-amber-400 text-amber-400"
                          : ""
                      }
                    />
                  </button>
                  <button
                    onClick={() => remove(entry.id)}
                    className="rounded p-1.5 text-muted hover:bg-accent hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
