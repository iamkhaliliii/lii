"use client";
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useContacts } from "@/hooks/useContacts";
import { Contact, ContactRelationship } from "@/types";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Users,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { useToast } from "@/components/Toast";

type SortBy = "name" | "recent" | "messages";

export default function ContactsPage() {
  const { contacts, remove, updateContact, loading } = useContacts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRel, setEditRel] = useState<ContactRelationship>("colleague");
  const [editFormality, setEditFormality] = useState<
    Contact["preferredFormality"]
  >("semi-formal");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const toast = useToast();

  const startEdit = (c: Contact) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditRel(c.relationship);
    setEditFormality(c.preferredFormality);
  };

  const saveEdit = async (c: Contact) => {
    await updateContact({
      ...c,
      name: editName,
      relationship: editRel,
      preferredFormality: editFormality,
    });
    setEditingId(null);
    toast.success("Contact updated");
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    toast.success("Contact deleted");
  };

  // Filter and sort
  const filtered = useMemo(() => {
    let list = contacts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "messages") return b.messageCount - a.messageCount;
      return b.lastInteraction - a.lastInteraction;
    });
  }, [contacts, search, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-1 text-lg font-bold">Contacts</h1>
        <p className="mb-5 text-sm text-muted">
          Manage your contacts for personalized translations
        </p>

        {/* Search + Sort */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
            />
          </div>
          <button
            onClick={() =>
              setSortBy((prev) =>
                prev === "recent"
                  ? "name"
                  : prev === "name"
                    ? "messages"
                    : "recent"
              )
            }
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-xs text-muted hover:text-foreground"
            title={`Sort by ${sortBy}`}
          >
            <ArrowUpDown size={12} />
            {sortBy === "recent"
              ? "Recent"
              : sortBy === "name"
                ? "Name"
                : "Messages"}
          </button>
        </div>

        {/* Contact list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent" />
                  <div className="flex-1">
                    <div className="mb-1 h-4 w-32 rounded bg-accent" />
                    <div className="h-3 w-20 rounded bg-accent" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={28} className="mx-auto mb-3 text-muted/40" />
            <p className="text-sm text-muted">
              {search
                ? "No contacts found"
                : "No contacts yet — they'll be auto-created when you translate messages"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const isEditing = editingId === c.id;
              return (
                <div
                  key={c.id}
                  className="card-hover rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: c.avatarColor }}
                    >
                      {c.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>

                    {/* Info */}
                    {isEditing ? (
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-28 rounded-md border border-border bg-background px-2 py-1 text-sm focus:border-primary/40 focus:outline-none"
                          autoFocus
                        />
                        <select
                          value={editRel}
                          onChange={(e) =>
                            setEditRel(
                              e.target.value as ContactRelationship
                            )
                          }
                          className="rounded-md border border-border bg-background px-1.5 py-1 text-xs focus:border-primary/40 focus:outline-none"
                        >
                          <option value="boss">Boss</option>
                          <option value="colleague">Colleague</option>
                          <option value="friend">Friend</option>
                          <option value="client">Client</option>
                          <option value="family">Family</option>
                          <option value="other">Other</option>
                        </select>
                        <select
                          value={editFormality}
                          onChange={(e) =>
                            setEditFormality(
                              e.target.value as Contact["preferredFormality"]
                            )
                          }
                          className="rounded-md border border-border bg-background px-1.5 py-1 text-xs focus:border-primary/40 focus:outline-none"
                        >
                          <option value="formal">Formal</option>
                          <option value="semi-formal">Semi-formal</option>
                          <option value="informal">Informal</option>
                          <option value="casual">Casual</option>
                        </select>
                        <button
                          onClick={() => saveEdit(c)}
                          className="rounded-md bg-primary p-1 text-white"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-md p-1 text-muted hover:text-foreground"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{c.name}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted">
                            <span>{c.relationship}</span>
                            <span className="text-border">·</span>
                            <span>{c.preferredFormality}</span>
                            <span className="text-border">·</span>
                            <span>
                              {c.messageCount} message
                              {c.messageCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            onClick={() => startEdit(c)}
                            className="rounded-lg p-1.5 text-muted hover:bg-accent hover:text-foreground"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="rounded-lg p-1.5 text-muted hover:bg-accent hover:text-danger"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
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
