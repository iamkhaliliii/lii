"use client";
import { useState, useCallback } from "react";
import { ChatMessage, PersonContext } from "@/types";
import { getChatMessages, saveChatMessage } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { getActiveProvider } from "@/lib/settings";
import { translateDirect, translateImageDirect, polishReplyDirect } from "@/lib/ai/client-direct";
import { providerNames } from "@/lib/ai/providers";

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const data = await getChatMessages(conversationId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const sendIncoming = useCallback(
    async (
      conversationId: string,
      text: string,
      options?: {
        detectTone?: boolean;
        personContext?: PersonContext;
        contactId?: string;
      }
    ) => {
      const { provider, model, apiKey } = getActiveProvider();
      if (!apiKey) throw new Error("Please set your API key in Settings first.");

      setSending(true);
      try {
        const data = await translateDirect({
          provider,
          apiKey,
          modelId: model,
          text,
          detectTone: options?.detectTone ?? true,
          personContext: options?.personContext,
        });

        const msg: ChatMessage = {
          id: generateId(),
          conversationId,
          contactId: options?.contactId,
          direction: "incoming",
          originalText: text,
          translatedText: data.translation || "",
          tone: data.tone || undefined,
          suggestedResponses: data.suggestedResponses || undefined,
          needsResponse: data.needsResponse !== false,
          source: "text",
          provider: providerNames[provider],
          model,
          timestamp: Date.now(),
        };

        await saveChatMessage(msg);
        setMessages((prev) => [...prev, msg]);
        return msg;
      } finally {
        setSending(false);
      }
    },
    []
  );

  const sendIncomingImage = useCallback(
    async (
      conversationId: string,
      imageBase64: string[],
      options?: {
        detectTone?: boolean;
        personContext?: PersonContext;
        contactId?: string;
      }
    ) => {
      const { provider, model, apiKey } = getActiveProvider();
      if (!apiKey) throw new Error("Please set your API key in Settings first.");

      setSending(true);
      try {
        const data = await translateImageDirect({
          provider,
          apiKey,
          modelId: model,
          imageBase64,
          detectTone: options?.detectTone ?? true,
          personContext: options?.personContext,
        });

        const extractedText = data.extractedText || `[${imageBase64.length} Image${imageBase64.length > 1 ? "s" : ""}]`;

        const msg: ChatMessage = {
          id: generateId(),
          conversationId,
          contactId: options?.contactId,
          direction: "incoming",
          originalText: extractedText,
          translatedText: data.translation || "",
          tone: data.tone || undefined,
          suggestedResponses: data.suggestedResponses || undefined,
          needsResponse: data.needsResponse !== false,
          source: "image",
          provider: providerNames[provider],
          model,
          timestamp: Date.now(),
        };

        await saveChatMessage(msg);
        setMessages((prev) => [...prev, msg]);
        return msg;
      } finally {
        setSending(false);
      }
    },
    []
  );

  const sendOutgoing = useCallback(
    async (
      conversationId: string,
      draft: string,
      originalMessage: string,
      options?: { contactId?: string }
    ) => {
      const { provider, model, apiKey } = getActiveProvider();
      if (!apiKey) throw new Error("Please set your API key in Settings first.");

      setSending(true);
      try {
        const result = await polishReplyDirect({
          provider,
          apiKey,
          modelId: model,
          draft,
          originalMessage,
        });

        const msg: ChatMessage = {
          id: generateId(),
          conversationId,
          contactId: options?.contactId,
          direction: "outgoing",
          originalText: draft,
          translatedText: result.farsi,
          polishedReply: result.polished,
          source: "text",
          provider: providerNames[provider],
          model,
          timestamp: Date.now(),
        };

        await saveChatMessage(msg);
        setMessages((prev) => [...prev, msg]);
        return msg;
      } finally {
        setSending(false);
      }
    },
    []
  );

  // Get the last incoming message (for polish context)
  const lastIncomingText = messages
    .filter((m) => m.direction === "incoming")
    .slice(-1)[0]?.originalText || "";

  return {
    messages,
    loading,
    sending,
    loadMessages,
    clearMessages,
    sendIncoming,
    sendIncomingImage,
    sendOutgoing,
    lastIncomingText,
  };
}
