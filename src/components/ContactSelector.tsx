"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Contact, ContactRelationship } from "@/types";

interface ContactSelectorProps {
  contacts: Contact[];
  selectedContactId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (name: string, relationship: ContactRelationship) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ContactAvatar({
  contact,
  size = "md",
}: {
  contact: Contact;
  size?: "sm" | "md";
}) {
  const sizeClasses =
    size === "sm"
      ? "h-4 w-4 text-[7px]"
      : "h-9 w-9 text-xs";

  if (contact.avatarUrl) {
    return (
      <img
        src={contact.avatarUrl}
        alt={contact.name}
        className={`${sizeClasses} rounded-full object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center rounded-full font-bold text-white`}
      style={{ backgroundColor: contact.avatarColor }}
    >
      {getInitials(contact.name)}
    </div>
  );
}

export { ContactAvatar };

export default function ContactSelector({
  contacts,
  selectedContactId,
  onSelect,
  onCreate,
}: ContactSelectorProps) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRel, setNewRel] = useState<ContactRelationship>("colleague");

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim(), newRel);
      setNewName("");
      setNewRel("colleague");
      setShowForm(false);
    }
  };

  const selected = contacts.find((c) => c.id === selectedContactId);

  if (contacts.length === 0 && !showForm) return null;

  return (
    <div className="space-y-2">
      <div className="hide-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5">
        {/* Contact chips */}
        {contacts.map((c) => {
          const isSelected = c.id === selectedContactId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(isSelected ? null : c.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-sm font-medium transition-all ${
                isSelected
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-accent text-muted hover:text-foreground"
              }`}
            >
              {/* Avatar */}
              {c.avatarUrl ? (
                <img
                  src={c.avatarUrl}
                  alt={c.name}
                  className={`h-6 w-6 rounded-full object-cover ${
                    isSelected ? "ring-1 ring-primary/40" : ""
                  }`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: isSelected ? "var(--primary)" : c.avatarColor }}
                >
                  {c.name[0].toUpperCase()}
                </span>
              )}
              {/* Name */}
              <span className="max-w-[88px] truncate">
                {c.name.split(" ")[0]}
              </span>
              {/* Close X when selected */}
              {isSelected && (
                <X size={14} className="shrink-0 text-primary/50" />
              )}
            </button>
          );
        })}

        {/* Add button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      {/* Selected info label */}
      {selected && (
        <p className="text-xs text-muted">
          Translating for{" "}
          <span className="font-medium text-foreground">{selected.name}</span>
          <span className="text-muted/40"> · {selected.relationship}</span>
        </p>
      )}

      {/* Inline creation form */}
      {showForm && (
        <div className="animate-scale-in flex items-center gap-2 rounded-lg border border-border bg-card p-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="w-28 rounded-md border border-border bg-background px-2 py-1 text-xs focus:border-primary/40 focus:outline-none"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <select
            value={newRel}
            onChange={(e) => setNewRel(e.target.value as ContactRelationship)}
            className="rounded-md border border-border bg-background px-1.5 py-1 text-xs focus:border-primary/40 focus:outline-none"
          >
            <option value="colleague">Colleague</option>
            <option value="boss">Boss</option>
            <option value="friend">Friend</option>
            <option value="client">Client</option>
            <option value="family">Family</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowForm(false);
              setNewName("");
            }}
            className="rounded p-0.5 text-muted hover:text-foreground"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
