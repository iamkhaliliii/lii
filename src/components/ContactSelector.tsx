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

  return (
    <div className="space-y-2">
      <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto">
        {/* Contact avatars */}
        {contacts.map((c) => {
          const isSelected = c.id === selectedContactId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="group flex shrink-0 flex-col items-center gap-1"
              title={c.name}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white transition-all ${
                  isSelected
                    ? "scale-105 ring-2 ring-primary"
                    : "group-hover:scale-105"
                }`}
                style={{ backgroundColor: c.avatarColor }}
              >
                {getInitials(c.name)}
              </div>
            </button>
          );
        })}

        {/* Add button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-muted hover:bg-accent hover:text-foreground"
          >
            <Plus size={12} />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Selected contact label */}
      {selected && (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span
            className="inline-flex h-3 w-3 items-center justify-center rounded-full text-[7px] font-bold text-white"
            style={{ backgroundColor: selected.avatarColor }}
          >
            {selected.name[0].toUpperCase()}
          </span>
          <span>
            {selected.name}{" "}
            <span className="text-muted/60">· {selected.relationship}</span>
          </span>
        </div>
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
