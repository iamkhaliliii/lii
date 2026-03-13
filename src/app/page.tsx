"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import ConversationSidebar from "@/components/ConversationSidebar";
import ChatMessageBubble from "@/components/ChatMessageBubble";
import ChatInput from "@/components/ChatInput";
import ContactSelector from "@/components/ContactSelector";
import ContactDetectionBanner from "@/components/ContactDetectionBanner";
import TranslationSkeleton from "@/components/TranslationSkeleton";
import { MessageCircle, Sparkles, ChevronDown, ImagePlus } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useConversations } from "@/hooks/useConversations";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useContacts } from "@/hooks/useContacts";
import { PersonContext } from "@/types";
import { saveContactMessage } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import {
  detectContactFromText,
  matchContactByName,
  type DetectionResult,
} from "@/lib/contact-detection";

export default function Home() {
  const { settings } = useSettings();
  const {
    contacts,
    selectedContactId,
    select: selectContact,
    create: createContact,
    getPersonContext,
  } = useContacts();

  const {
    conversations,
    activeId,
    activeConversation,
    create: createConversation,
    select: selectConversation,
    remove: removeConversation,
    refreshConversation,
    updateConversation,
    load: loadConversations,
  } = useConversations();

  const {
    messages,
    loading: messagesLoading,
    sending,
    loadMessages,
    clearMessages,
    sendIncoming,
    sendIncomingImage,
    sendOutgoing,
    lastIncomingText,
  } = useChatMessages();

  const [error, setError] = useState("");
  const [prefill, setPrefill] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Detection state
  const [detectionResult, setDetectionResult] = useState<{
    parsed: { detectedName: string | null; cleanedText: string; format: string };
    match: DetectionResult;
  } | null>(null);
  const [detectionConfirmed, setDetectionConfirmed] = useState(false);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
      // Also set contact from conversation
      if (activeConversation?.contactId) {
        selectContact(activeConversation.contactId);
      }
    } else {
      clearMessages();
    }
  }, [activeId, activeConversation?.contactId, loadMessages, clearMessages, selectContact]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distFromBottom > 150);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Build person context
  const buildContext = useCallback(
    async (): Promise<PersonContext | undefined> => {
      if (!selectedContactId) return undefined;
      const ctx = await getPersonContext(selectedContactId);
      return ctx || undefined;
    },
    [selectedContactId, getPersonContext]
  );

  // Check for Slack translate request (from /slack page)
  const slackTranslateProcessed = useRef(false);
  useEffect(() => {
    if (slackTranslateProcessed.current) return;
    const raw = sessionStorage.getItem("lii-slack-translate");
    if (!raw) return;
    slackTranslateProcessed.current = true;
    sessionStorage.removeItem("lii-slack-translate");
    try {
      const data = JSON.parse(raw);
      if (data.text) {
        // Create a new conversation and auto-send the text
        (async () => {
          const conv = await createConversation(undefined, data.senderName || data.text.slice(0, 40));
          // Small delay to let state settle
          setTimeout(() => {
            handleSendText(data.text);
          }, 100);
        })();
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle new chat creation
  const handleNewChat = useCallback(async () => {
    selectContact(null);
    setDetectionResult(null);
    setDetectionConfirmed(false);
    setError("");
    await createConversation();
  }, [createConversation, selectContact]);

  // Handle sending text
  const handleSendText = useCallback(
    async (text: string) => {
      setError("");

      // If no active conversation, create one
      let convId = activeId;
      if (!convId) {
        const conv = await createConversation(
          selectedContactId || undefined,
          text.slice(0, 40)
        );
        convId = conv.id;
      }

      // Contact detection
      let actualText = text;
      if (!selectedContactId) {
        const result = detectContactFromText(text, contacts);
        if (result.match.type === "exact") {
          selectContact(result.match.contact.id);
          actualText = result.parsed.cleanedText || text;
        } else if (result.match.type === "fuzzy" || result.match.type === "new") {
          setDetectionResult(result);
          setDetectionConfirmed(false);
        }
      }

      try {
        const personContext = await buildContext();
        const msg = await sendIncoming(convId, actualText, {
          detectTone: settings.autoDetectTone,
          personContext,
          contactId: selectedContactId || undefined,
        });

        // LLM sender fallback
        if (!selectedContactId && msg.tone?.detectedSender) {
          const llmMatch = matchContactByName(msg.tone.detectedSender, contacts);
          if (llmMatch.type === "exact") {
            selectContact(llmMatch.contact.id);
          } else if (llmMatch.type === "fuzzy" || llmMatch.type === "new") {
            setDetectionResult({
              parsed: {
                detectedName: msg.tone.detectedSender,
                cleanedText: actualText,
                format: "generic",
              },
              match: llmMatch,
            });
            setDetectionConfirmed(false);
          }
        }

        // Auto-title: update conversation title from first message
        if (activeConversation?.title === "New Chat" || !activeId) {
          const autoTitle = actualText.slice(0, 50) + (actualText.length > 50 ? "…" : "");
          const conv = conversations.find((c) => c.id === convId);
          if (conv && conv.title === "New Chat") {
            await updateConversation({ ...conv, title: autoTitle, updatedAt: Date.now() });
          }
        }

        // Save to contact history
        if (selectedContactId) {
          await saveContactMessage({
            id: generateId(),
            contactId: selectedContactId,
            direction: "from_them",
            originalText: actualText,
            translatedText: msg.translatedText,
            tone: msg.tone || undefined,
            timestamp: Date.now(),
          });
        }

        await refreshConversation(convId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Translation failed");
      }
    },
    [
      activeId,
      activeConversation,
      conversations,
      selectedContactId,
      contacts,
      settings.autoDetectTone,
      buildContext,
      createConversation,
      sendIncoming,
      selectContact,
      refreshConversation,
      updateConversation,
    ]
  );

  // Handle sending images
  const handleSendImage = useCallback(
    async (base64List: string[]) => {
      setError("");

      let convId = activeId;
      if (!convId) {
        const conv = await createConversation(selectedContactId || undefined);
        convId = conv.id;
      }

      try {
        const personContext = await buildContext();
        await sendIncomingImage(convId, base64List, {
          detectTone: settings.autoDetectTone,
          personContext,
          contactId: selectedContactId || undefined,
        });
        await refreshConversation(convId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Image translation failed"
        );
      }
    },
    [
      activeId,
      selectedContactId,
      settings.autoDetectTone,
      buildContext,
      createConversation,
      sendIncomingImage,
      refreshConversation,
    ]
  );

  // Handle sending reply (polish mode)
  const handleSendReply = useCallback(
    async (draft: string) => {
      if (!activeId) return;
      setError("");

      try {
        const msg = await sendOutgoing(
          activeId,
          draft,
          lastIncomingText,
          { contactId: selectedContactId || undefined }
        );

        // Save to contact history
        if (selectedContactId && msg) {
          await saveContactMessage({
            id: generateId(),
            contactId: selectedContactId,
            direction: "to_them",
            originalText: msg.polishedReply || draft,
            translatedText: msg.translatedText,
            timestamp: Date.now(),
          });
        }

        await refreshConversation(activeId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to polish reply");
      }
    },
    [activeId, lastIncomingText, selectedContactId, sendOutgoing, refreshConversation]
  );

  // Handle suggestion use
  const handleUseSuggestion = useCallback((text: string) => {
    setPrefill(text);
  }, []);

  // Handle text change for contact detection
  const handleTextChange = useCallback(
    (text: string) => {
      if (selectedContactId) {
        setDetectionResult(null);
        return;
      }
      const result = detectContactFromText(text, contacts);
      if (result.match.type === "none") {
        setDetectionResult(null);
      } else {
        setDetectionResult(result);
        setDetectionConfirmed(false);
        if (result.match.type === "exact") {
          selectContact(result.match.contact.id);
          setDetectionConfirmed(true);
        }
      }
    },
    [contacts, selectedContactId, selectContact]
  );

  // Detection banner handlers
  const handleConfirmFuzzy = useCallback(() => {
    if (detectionResult?.match.type === "fuzzy") {
      selectContact(detectionResult.match.contact.id);
      setDetectionConfirmed(true);
    }
  }, [detectionResult, selectContact]);

  const handleCreateNewFromDetection = useCallback(async () => {
    if (detectionResult?.parsed.detectedName) {
      const contact = await createContact(
        detectionResult.parsed.detectedName,
        "colleague"
      );
      selectContact(contact.id);
      setDetectionConfirmed(true);
      setDetectionResult(null);
    }
  }, [detectionResult, createContact, selectContact]);

  const handleDismissDetection = useCallback(() => {
    setDetectionResult(null);
  }, []);

  const showDetectionBanner =
    detectionResult &&
    detectionResult.match.type !== "none" &&
    !detectionConfirmed;

  // Group messages with date separators
  const messagesWithDates = useMemo(() => {
    const items: Array<{ type: "date"; label: string } | { type: "message"; id: string }> = [];
    let lastDate = "";
    for (const msg of messages) {
      const d = new Date(msg.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      let dateLabel: string;
      if (d.toDateString() === today.toDateString()) {
        dateLabel = "Today";
      } else if (d.toDateString() === yesterday.toDateString()) {
        dateLabel = "Yesterday";
      } else {
        dateLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
      }
      if (dateLabel !== lastDate) {
        items.push({ type: "date", label: dateLabel });
        lastDate = dateLabel;
      }
      items.push({ type: "message", id: msg.id });
    }
    return items;
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId}
          contacts={contacts}
          onSelect={selectConversation}
          onCreate={handleNewChat}
          onDelete={removeConversation}
          onSearch={(q) => loadConversations(q || undefined)}
        />

        {/* Chat pane */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeConversation ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-border-subtle bg-card/50 px-4 py-2 backdrop-blur-sm">
                <div className="flex-1 min-w-0">
                  <ContactSelector
                    contacts={contacts}
                    selectedContactId={selectedContactId}
                    onSelect={selectContact}
                    onCreate={createContact}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {messages.length > 0 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted/50">
                      {messages.length} message{messages.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Detection banner */}
              {showDetectionBanner && (
                <div className="px-4 py-2 border-b border-border-subtle">
                  <ContactDetectionBanner
                    match={detectionResult.match}
                    detectedName={detectionResult.parsed.detectedName!}
                    onConfirmExact={() => setDetectionConfirmed(true)}
                    onConfirmFuzzy={handleConfirmFuzzy}
                    onCreateNew={handleCreateNewFromDetection}
                    onDismiss={handleDismissDetection}
                  />
                </div>
              )}

              {/* Messages */}
              <main
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="relative flex-1 overflow-y-auto bg-background chat-scroll"
              >
                <div className="mx-auto max-w-3xl space-y-4 px-4 py-5">
                  {/* Error */}
                  {error && (
                    <div className="animate-slide-up rounded-xl bg-danger-light p-3 text-sm text-danger">
                      {error}
                    </div>
                  )}

                  {/* Message list */}
                  {messagesLoading ? (
                    <div className="space-y-3">
                      <TranslationSkeleton />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-surface-hover">
                        <Sparkles size={26} className="text-muted/40" />
                      </div>
                      <p className="text-sm font-medium text-muted/60">
                        Paste a message or screenshot
                      </p>
                      <p className="mt-1.5 max-w-[260px] text-xs leading-relaxed text-muted/40">
                        Translate, analyze tone, and get smart reply suggestions — all in one go
                      </p>
                      <div className="mt-5 flex items-center gap-3 text-[10px] text-muted/30">
                        <span className="flex items-center gap-1">
                          <kbd className="rounded border border-border-subtle px-1 py-0.5 font-mono text-[9px]">⌘V</kbd>
                          paste text
                        </span>
                        <span className="h-3 w-px bg-border-subtle" />
                        <span className="flex items-center gap-1">
                          <ImagePlus size={10} />
                          drop image
                        </span>
                      </div>
                    </div>
                  ) : (
                    messagesWithDates.map((item, idx) => {
                      if (item.type === "date") {
                        return (
                          <div key={`date-${item.label}`} className="flex items-center gap-3 py-2">
                            <div className="h-px flex-1 bg-border-subtle" />
                            <span className="shrink-0 rounded-full bg-accent px-3 py-0.5 text-[10px] font-medium text-muted/60">
                              {item.label}
                            </span>
                            <div className="h-px flex-1 bg-border-subtle" />
                          </div>
                        );
                      }
                      const msg = messages.find((m) => m.id === item.id);
                      if (!msg) return null;
                      return (
                        <ChatMessageBubble
                          key={msg.id}
                          message={msg}
                          onUseSuggestion={handleUseSuggestion}
                          animationDelay={idx * 30}
                        />
                      );
                    })
                  )}

                  {/* Typing/sending indicator */}
                  {sending && (
                    <div className="animate-bubble-in flex justify-start">
                      <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Scroll to bottom button */}
                {showScrollBottom && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 animate-fade-in rounded-full border border-border bg-card p-2 shadow-md transition-all hover:bg-surface-hover hover:shadow-lg active:scale-95"
                    title="Scroll to bottom"
                  >
                    <ChevronDown size={16} className="text-muted" />
                  </button>
                )}
              </main>

              {/* Input */}
              <ChatInput
                onSendText={handleSendText}
                onSendReply={handleSendReply}
                onSendImage={handleSendImage}
                onTextChange={handleTextChange}
                sending={sending}
                prefill={prefill}
                onPrefillUsed={() => setPrefill("")}
              />
            </>
          ) : (
            /* Empty state — no active conversation */
            <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
              <div className="animate-fade-in flex flex-col items-center">
                <div className="relative mb-6 inline-block">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-surface-hover">
                    <MessageCircle size={32} className="text-primary/60" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-sm">
                    <Sparkles size={14} className="text-white" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  lii
                </h3>
                <p className="mb-2 max-w-[280px] text-sm text-muted">
                  English → Farsi translator with tone analysis, smart reply suggestions, and conversation history.
                </p>
                <div className="mb-8 flex items-center justify-center gap-4 text-[11px] text-muted/50">
                  <span>Translate</span>
                  <span className="h-3 w-px bg-border" />
                  <span>Analyze tone</span>
                  <span className="h-3 w-px bg-border" />
                  <span>Reply</span>
                </div>
                <button
                  onClick={handleNewChat}
                  className="group flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
                >
                  <MessageCircle size={16} className="transition-transform group-hover:scale-110" />
                  New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
