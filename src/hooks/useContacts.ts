"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Contact, ContactRelationship, AVATAR_COLORS } from "@/types";
import {
  getContacts,
  saveContact,
  deleteContact as deleteContactFromDB,
  getRecentContactMessages,
} from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { matchContactByName, DetectionResult } from "@/lib/contact-detection";

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      load();
    }
  }, [load]);

  const create = useCallback(
    async (name: string, relationship: ContactRelationship) => {
      const defaultFormality: Record<
        ContactRelationship,
        Contact["preferredFormality"]
      > = {
        boss: "formal",
        colleague: "semi-formal",
        client: "formal",
        friend: "informal",
        family: "casual",
        other: "semi-formal",
      };

      const colorIndex = contacts.length % AVATAR_COLORS.length;

      const contact: Contact = {
        id: generateId(),
        name,
        avatarColor: AVATAR_COLORS[colorIndex],
        relationship,
        preferredFormality: defaultFormality[relationship],
        communicationNotes: "",
        lastInteraction: Date.now(),
        messageCount: 0,
        createdAt: Date.now(),
      };

      await saveContact(contact);
      setContacts((prev) => [contact, ...prev]);
      return contact;
    },
    [contacts.length]
  );

  const select = useCallback(
    (id: string | null) => {
      setSelectedContactId((prev) => (prev === id ? null : id));
    },
    []
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteContactFromDB(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (selectedContactId === id) {
        setSelectedContactId(null);
      }
    },
    [selectedContactId]
  );

  const updateContact = useCallback(async (updated: Contact) => {
    await saveContact(updated);
    setContacts((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }, []);

  const getPersonContext = useCallback(
    async (contactId: string) => {
      const contact = contacts.find((c) => c.id === contactId);
      if (!contact) return null;

      const messages = await getRecentContactMessages(contactId, 10);

      return {
        name: contact.name,
        relationship: contact.relationship,
        preferredFormality: contact.preferredFormality,
        communicationNotes: contact.communicationNotes,
        recentMessages: messages.map((m) => ({
          direction: m.direction,
          text: m.originalText,
        })),
      };
    },
    [contacts]
  );

  const findByName = useCallback(
    (name: string): DetectionResult => {
      return matchContactByName(name, contacts);
    },
    [contacts]
  );

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || null;

  return {
    contacts,
    selectedContact,
    selectedContactId,
    loading,
    load,
    create,
    select,
    remove,
    updateContact,
    getPersonContext,
    findByName,
  };
}
