"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useContacts } from "@/hooks/useContacts";
import { Contact, ContactRelationship } from "@/types";
import { Pencil, Trash2, MessageSquare, Clock } from "lucide-react";
import { useToast } from "@/components/Toast";

const relationshipLabels: Record<ContactRelationship, string> = {
  boss: "Boss",
  colleague: "Colleague",
  friend: "Friend",
  client: "Client",
  family: "Family",
  other: "Other",
};

const formalityLabels: Record<string, string> = {
  formal: "Formal",
  "semi-formal": "Semi-formal",
  informal: "Informal",
  casual: "Casual",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ContactsPage() {
  const { contacts, remove, updateContact, loading } = useContacts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRelationship, setEditRelationship] =
    useState<ContactRelationship>("colleague");
  const [editFormality, setEditFormality] = useState("semi-formal");
  const toast = useToast();

  const startEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setEditName(contact.name);
    setEditRelationship(contact.relationship);
    setEditFormality(contact.preferredFormality);
  };

  const saveEdit = async (contact: Contact) => {
    await updateContact({
      ...contact,
      name: editName,
      relationship: editRelationship,
      preferredFormality: editFormality as Contact["preferredFormality"],
    });
    setEditingId(null);
    toast.success("Contact updated!");
  };

  const handleDelete = async (id: string, name: string) => {
    await remove(id);
    toast.success(`${name} removed`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold">Contacts</h1>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted">Loading...</p>
        ) : contacts.length === 0 ? (
          <div className="animate-fade-in py-16 text-center">
            <p className="mb-2 text-sm text-muted">No contacts yet</p>
            <p className="text-xs text-muted">
              Add contacts from the translation page to track conversations
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="animate-slide-up rounded-2xl border border-border bg-card p-4"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                {editingId === contact.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <select
                        value={editRelationship}
                        onChange={(e) =>
                          setEditRelationship(
                            e.target.value as ContactRelationship
                          )
                        }
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      >
                        {(
                          Object.entries(relationshipLabels) as [
                            ContactRelationship,
                            string,
                          ][]
                        ).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editFormality}
                        onChange={(e) => setEditFormality(e.target.value)}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      >
                        {Object.entries(formalityLabels).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(contact)}
                        className="gradient-btn rounded-lg px-4 py-1.5 text-sm font-medium text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-border px-4 py-1.5 text-sm text-muted hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: contact.avatarColor }}
                    >
                      {getInitials(contact.name)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{contact.name}</h3>
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-muted">
                          {relationshipLabels[contact.relationship]}
                        </span>
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-muted">
                          {formalityLabels[contact.preferredFormality]}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={11} />
                          {contact.messageCount} messages
                        </span>
                        {contact.lastInteraction && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(
                              contact.lastInteraction
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Communication notes */}
                      {contact.communicationNotes && (
                        <p className="mt-2 text-xs leading-relaxed text-muted">
                          {contact.communicationNotes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => startEdit(contact)}
                        className="rounded-lg p-2 text-muted hover:bg-accent hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id, contact.name)}
                        className="rounded-lg p-2 text-muted hover:bg-accent hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
