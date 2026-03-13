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

const relationshipLabels: Record<ContactRelationship, string> = {
  boss: "Boss",
  colleague: "Colleague",
  friend: "Friend",
  client: "Client",
  family: "Family",
  other: "Other",
};

function getInitials(name: string): string {
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
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelationship, setNewRelationship] =
    useState<ContactRelationship>("colleague");

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim(), newRelationship);
    setNewName("");
    setNewRelationship("colleague");
    setShowNew(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === "Escape") {
      setShowNew(false);
    }
  };

  return (
    <div className="mb-3">
      <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {/* Add contact button */}
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border text-muted hover:border-primary hover:text-primary"
          title="Add contact"
        >
          {showNew ? <X size={16} /> : <Plus size={16} />}
        </button>

        {/* Contact avatars */}
        {contacts.map((contact) => {
          const isSelected = selectedContactId === contact.id;
          return (
            <button
              key={contact.id}
              onClick={() => onSelect(contact.id)}
              className="group flex shrink-0 flex-col items-center gap-1"
              title={`${contact.name} (${relationshipLabels[contact.relationship]})`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white transition-all ${
                  isSelected
                    ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "group-hover:scale-105"
                }`}
                style={{ backgroundColor: contact.avatarColor }}
              >
                {getInitials(contact.name)}
              </div>
              <span
                className={`max-w-[56px] truncate text-[10px] leading-tight ${
                  isSelected ? "font-medium text-primary" : "text-muted"
                }`}
              >
                {contact.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* New contact inline form */}
      {showNew && (
        <div className="animate-scale-in mt-2 flex items-center gap-2 rounded-xl border border-border bg-card p-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Name..."
            autoFocus
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
          <select
            value={newRelationship}
            onChange={(e) =>
              setNewRelationship(e.target.value as ContactRelationship)
            }
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
          >
            {(
              Object.entries(relationshipLabels) as [
                ContactRelationship,
                string,
              ][]
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="gradient-btn rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
