"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useHistory } from "@/hooks/useHistory";
import { BilingualSuggestion, Contact } from "@/types";
import { getContacts } from "@/lib/storage";
import { Search, Star, Trash2, Copy, Check, Clock, User } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function HistoryPage() {
  const { entries, loading, load, remove, star } = useHistory();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const toast = useToast();

  useEffect(() => {
    load();
    // Load contacts map for displaying contact names
    getContacts().then((list) => {
      const map: Record<string, Contact> = {};
      list.forEach((c) => (map[c.id] = c));
      setContacts(map);
    });
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Normalize suggestions for backward compat (old string[] → BilingualSuggestion[])
  const normalizeSuggestions = (
    raw: unknown
  ): BilingualSuggestion[] | undefined => {
    if (!raw || !Array.isArray(raw) || raw.length === 0) return undefined;
    if (typeof raw[0] === "string") {
      return (raw as string[]).map((s) => ({ english: "", farsi: s }));
    }
    return raw as BilingualSuggestion[];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-1 text-xl font-bold">Translation History</h1>
        <p className="mb-5 text-sm text-muted">
          Your saved translations and suggestions
        </p>

        {/* Search */}
        <div className="relative mb-5">
          <Search
            size={16}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search translations..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-sm focus:border-primary/60 focus:outline-none"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-border bg-card p-4"
              >
                <div className="mb-3 h-4 w-3/4 rounded bg-accent" />
                <div className="mb-2 h-4 w-1/2 rounded bg-accent" />
                <div className="h-3 w-1/4 rounded bg-accent" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <Clock size={32} className="mx-auto mb-3 text-muted/50" />
            <p className="text-sm text-muted">
              {search ? "No results found" : "No translations saved yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => {
              const contact = entry.contactId
                ? contacts[entry.contactId]
                : null;
              const suggestions = normalizeSuggestions(
                entry.suggestedResponses
              );

              return (
                <div
                  key={entry.id}
                  className="animate-slide-up card-hover overflow-hidden rounded-2xl border border-border bg-card"
                  style={{
                    animationDelay: `${index * 30}ms`,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div className="flex">
                    {/* Accent border */}
                    <div
                      className="w-1 shrink-0"
                      style={{
                        background: entry.starred
                          ? "#f59e0b"
                          : "var(--gradient-primary)",
                      }}
                    />
                    <div className="min-w-0 flex-1 p-4">
                      {/* Header: date + contact */}
                      <div className="mb-2 flex items-center gap-2">
                        {contact && (
                          <span className="flex items-center gap-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted">
                            <span
                              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                              style={{
                                backgroundColor: contact.avatarColor,
                              }}
                            >
                              {contact.name[0].toUpperCase()}
                            </span>
                            {contact.name}
                          </span>
                        )}
                        <span className="ml-auto shrink-0 text-[10px] text-muted">
                          {new Date(entry.timestamp).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>

                      {/* Original text */}
                      <p
                        dir="ltr"
                        className="mb-2 text-sm leading-relaxed text-muted line-clamp-2"
                      >
                        {entry.originalText}
                      </p>

                      {/* Translated text */}
                      <p
                        className="rtl mb-3 text-sm leading-relaxed"
                        style={{
                          fontFamily:
                            "var(--font-vazirmatn), system-ui, sans-serif",
                        }}
                      >
                        {entry.translatedText}
                      </p>

                      {/* Tone chips */}
                      {entry.tone && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted">
                            {entry.tone.formality}
                          </span>
                          {entry.tone.likelySender && (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted">
                              <User size={8} className="mr-0.5 inline" />
                              {entry.tone.likelySender}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bilingual suggestions */}
                      {suggestions && suggestions.length > 0 && (
                        <div className="mb-3 space-y-1">
                          <p className="text-[10px] font-medium text-muted/60">
                            Suggestions
                          </p>
                          {suggestions.slice(0, 2).map((s, si) => (
                            <div
                              key={si}
                              className="rounded-lg bg-accent/60 px-2.5 py-1.5"
                            >
                              {s.english && (
                                <p
                                  dir="ltr"
                                  className="text-xs leading-relaxed text-foreground"
                                >
                                  {s.english}
                                </p>
                              )}
                              {s.farsi && (
                                <p
                                  className="rtl text-[10px] leading-relaxed text-muted"
                                  style={{
                                    fontFamily:
                                      "var(--font-vazirmatn), system-ui, sans-serif",
                                  }}
                                >
                                  {s.farsi}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleCopy(entry.translatedText, entry.id)
                          }
                          className="rounded-lg p-1.5 text-muted hover:bg-accent hover:text-foreground"
                          title="Copy translation"
                        >
                          {copiedId === entry.id ? (
                            <Check size={14} className="text-success" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => star(entry.id)}
                          className="rounded-lg p-1.5 text-muted hover:bg-accent hover:text-foreground"
                          title={entry.starred ? "Unstar" : "Star"}
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
                          className="rounded-lg p-1.5 text-muted hover:bg-accent hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>

                        {/* Provider pill */}
                        <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted">
                          {entry.provider}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
