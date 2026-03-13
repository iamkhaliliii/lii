"use client";
import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useHistory } from "@/hooks/useHistory";
import { BilingualSuggestion, Contact, HistoryEntry } from "@/types";
import { getContacts } from "@/lib/storage";
import { Search, Star, Trash2, Copy, Check, Clock } from "lucide-react";
import { useToast } from "@/components/Toast";

function getDateGroup(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && now.getDate() === date.getDate()) return "Today";
  if (diffDays <= 1) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  return "Older";
}

export default function HistoryPage() {
  const { entries, loading, load, remove, star } = useHistory();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const toast = useToast();

  useEffect(() => {
    load();
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

  // Normalize old string[] suggestions to BilingualSuggestion[]
  const normalizeSuggestions = (
    raw: unknown
  ): BilingualSuggestion[] | undefined => {
    if (!raw || !Array.isArray(raw) || raw.length === 0) return undefined;
    if (typeof raw[0] === "string") {
      return (raw as string[]).map((s) => ({ english: "", farsi: s }));
    }
    return raw as BilingualSuggestion[];
  };

  // Group entries by date
  const grouped = useMemo(() => {
    const groups: { label: string; entries: HistoryEntry[] }[] = [];
    let currentLabel = "";

    for (const entry of entries) {
      const label = getDateGroup(entry.timestamp);
      if (label !== currentLabel) {
        groups.push({ label, entries: [entry] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    }
    return groups;
  }, [entries]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-1 text-lg font-bold">History</h1>
        <p className="mb-5 text-sm text-muted">Your saved translations</p>

        {/* Search */}
        <div className="relative mb-5">
          <Search
            size={15}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search translations..."
            className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
                <div className="mb-3 h-4 w-3/4 rounded bg-accent" />
                <div className="mb-2 h-4 w-1/2 rounded bg-accent" />
                <div className="h-3 w-1/4 rounded bg-accent" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <Clock size={28} className="mx-auto mb-3 text-muted/40" />
            <p className="text-sm text-muted">
              {search ? "No results found" : "No translations saved yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <div key={group.label}>
                {/* Date group header */}
                <p className="mb-2 text-[11px] font-medium tracking-wide text-muted/60 uppercase">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.entries.map((entry) => {
                    const contact = entry.contactId
                      ? contacts[entry.contactId]
                      : null;
                    const suggestions = normalizeSuggestions(
                      entry.suggestedResponses
                    );

                    return (
                      <div
                        key={entry.id}
                        className="card-hover rounded-xl border border-border bg-card p-4"
                      >
                        {/* Header: contact + date */}
                        <div className="mb-2 flex items-center gap-2">
                          {contact && (
                            <span className="flex items-center gap-1 text-[11px] text-muted">
                              {contact.avatarUrl ? (
                                <img
                                  src={contact.avatarUrl}
                                  alt={contact.name}
                                  className="h-3.5 w-3.5 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span
                                  className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white"
                                  style={{
                                    backgroundColor: contact.avatarColor,
                                  }}
                                >
                                  {contact.name[0].toUpperCase()}
                                </span>
                              )}
                              {contact.name}
                            </span>
                          )}
                          <span className="ml-auto text-[10px] text-muted/60">
                            {new Date(entry.timestamp).toLocaleTimeString(
                              undefined,
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>

                        {/* Original text */}
                        <p
                          dir="ltr"
                          className="mb-1.5 text-sm leading-relaxed text-muted line-clamp-2"
                        >
                          {entry.originalText}
                        </p>

                        {/* Translation */}
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
                            <span className="rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-medium text-primary">
                              {entry.tone.formality}
                            </span>
                            {entry.tone.likelySender && (
                              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted">
                                {entry.tone.likelySender}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bilingual suggestions */}
                        {suggestions && suggestions.length > 0 && (
                          <div className="mb-3 space-y-1">
                            <p className="text-[10px] font-medium text-muted/50">
                              Suggestions
                            </p>
                            {suggestions.slice(0, 2).map((s, si) => (
                              <div
                                key={si}
                                className="rounded-lg bg-accent px-2.5 py-1.5"
                              >
                                {s.english && (
                                  <p dir="ltr" className="text-xs text-foreground">
                                    {s.english}
                                  </p>
                                )}
                                {s.farsi && (
                                  <p
                                    className="rtl text-[10px] text-muted"
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
                        <div className="flex items-center gap-0.5 border-t border-border-subtle pt-2">
                          <button
                            onClick={() =>
                              handleCopy(entry.translatedText, entry.id)
                            }
                            className="rounded-lg p-1.5 text-muted hover:bg-accent hover:text-foreground"
                            title="Copy"
                          >
                            {copiedId === entry.id ? (
                              <Check size={13} className="text-success" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                          <button
                            onClick={() => star(entry.id)}
                            className="rounded-lg p-1.5 text-muted hover:bg-accent hover:text-foreground"
                            title={entry.starred ? "Unstar" : "Star"}
                          >
                            <Star
                              size={13}
                              className={
                                entry.starred
                                  ? "fill-warning text-warning"
                                  : ""
                              }
                            />
                          </button>
                          <button
                            onClick={() => remove(entry.id)}
                            className="rounded-lg p-1.5 text-muted hover:bg-accent hover:text-danger"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                          <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted/60">
                            {entry.provider}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
