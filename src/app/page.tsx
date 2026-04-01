"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Languages,
  Sparkles,
  ImagePlus,
  X,
  Send,
  Loader2,
  ArrowUpRight,
  Copy,
  Check,
  Gauge,
  Smile,
  User,
  MessageCircleReply,
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { translateDirect, translateImageDirect, polishReplyDirect } from "@/lib/ai/client-direct";
import { getModelById } from "@/lib/ai/providers";
import { BilingualSuggestion, ToneAnalysis } from "@/types";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Translation result type ────────────────────────────────

interface TranslationResult {
  id: string;
  originalText: string;
  translatedText: string;
  direction?: "en2fa" | "fa2en";
  tone?: ToneAnalysis;
  suggestedResponses?: BilingualSuggestion[];
  needsResponse?: boolean;
  source: "text" | "image";
  images?: string[];
  timestamp: number;
}

// ─── Copy button ────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted/50 transition-colors hover:bg-accent hover:text-foreground"
      title="Copy"
    >
      {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Tone badge ─────────────────────────────────────────────

function ToneBadge({ tone }: { tone: ToneAnalysis }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-muted/70">
        <Gauge size={9} /> {tone.formality}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-muted/70">
        <Smile size={9} /> {tone.sentiment}
      </span>
      {tone.likelySender && (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-muted/70">
          <User size={9} /> {tone.likelySender}
        </span>
      )}
    </div>
  );
}

// ─── Result card ────────────────────────────────────────────

function ResultCard({
  result,
  onReply,
  onUseSuggestion,
}: {
  result: TranslationResult;
  onReply: (text: string) => void;
  onUseSuggestion: (text: string) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [customReply, setCustomReply] = useState("");
  const customReplyRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize custom reply textarea
  useEffect(() => {
    const ta = customReplyRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 80)}px`;
    }
  }, [customReply]);

  const isFa2En = result.direction === "fa2en";
  const originalLabel = isFa2En ? "فارسی / Finglish" : "English";
  const translationLabel = isFa2En ? "English" : "فارسی";
  const originalDir = isFa2En ? "rtl" : "ltr";
  const translationDir = isFa2En ? "ltr" : "rtl";

  return (
    <div className="animate-slide-up rounded-2xl border border-border bg-card p-5 shadow-xs">
      {/* Direction indicator */}
      {result.direction && (
        <div className="mb-3 flex items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium",
            isFa2En ? "bg-blue-500/10 text-blue-600" : "bg-primary/10 text-primary"
          )}>
            {isFa2En ? "🇮🇷 → 🇬🇧 Farsi to English" : "🇬🇧 → 🇮🇷 English to Farsi"}
          </span>
        </div>
      )}

      {/* Original */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted/40">
            {originalLabel}
          </span>
          <CopyButton text={result.originalText} />
        </div>
        {result.images && result.images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {result.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Image ${i + 1}`}
                className="h-16 w-16 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
        <p dir={originalDir} className="text-[13px] leading-relaxed text-foreground/70 whitespace-pre-wrap">
          {result.originalText}
        </p>
      </div>

      {/* Divider */}
      <div className="my-3 h-px bg-border-subtle" />

      {/* Translation */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-primary/60">
            {translationLabel}
          </span>
          <CopyButton text={result.translatedText} />
        </div>
        <p dir={translationDir} className="text-[15px] font-medium leading-relaxed text-foreground whitespace-pre-wrap">
          {result.translatedText}
        </p>
      </div>

      {/* Tone */}
      {result.tone && (
        <div className="mb-3">
          <ToneBadge tone={result.tone} />
          {result.tone.context && (
            <p className="mt-1.5 text-[11px] text-muted/50 leading-relaxed">
              {result.tone.context}
            </p>
          )}
        </div>
      )}

      {/* Suggestions + Custom reply */}
      <div className="mt-3">
        {result.suggestedResponses && result.suggestedResponses.length > 0 && (
          <>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted/40 hover:text-muted/60 transition-colors"
            >
              <MessageCircleReply size={10} />
              Suggested Replies ({result.suggestedResponses.length})
            </button>
            {showSuggestions && (
              <div className="space-y-1.5 mb-3">
                {result.suggestedResponses.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onUseSuggestion(s.english || s.farsi)}
                    className="group block w-full rounded-lg border border-border-subtle bg-accent/30 px-3 py-2 text-left transition-colors hover:border-primary/20 hover:bg-primary-muted"
                  >
                    {s.english && (
                      <p className="text-[12px] text-foreground/70 group-hover:text-foreground transition-colors">
                        {s.english}
                      </p>
                    )}
                    {s.farsi && (
                      <p dir="rtl" className="text-[11px] text-muted/50 mt-0.5">
                        {s.farsi}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Custom reply input — always shown */}
        <div className="flex items-end gap-2">
          <div className={cn(
            "flex-1 overflow-hidden rounded-lg border bg-accent/20 transition-all focus-within:ring-1 focus-within:ring-primary/10",
            customReply ? "border-primary/30" : "border-border-subtle"
          )}>
            <textarea
              ref={customReplyRef}
              value={customReply}
              onChange={(e) => setCustomReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && customReply.trim()) {
                  e.preventDefault();
                  onUseSuggestion(customReply.trim());
                  setCustomReply("");
                }
              }}
              placeholder="Write your own reply (Farsi, Finglish, or English)…"
              dir="auto"
              rows={1}
              className="w-full resize-none border-0 bg-transparent px-3 py-2 text-[12px] leading-relaxed placeholder-muted/40 focus:outline-none"
              style={{ maxHeight: 80 }}
            />
          </div>
          <button
            onClick={() => {
              if (customReply.trim()) {
                onUseSuggestion(customReply.trim());
                setCustomReply("");
              }
            }}
            disabled={!customReply.trim()}
            className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-background transition-colors hover:bg-primary-hover disabled:opacity-30"
            title="Polish reply (↵)"
          >
            <ArrowUpRight size={13} />
          </button>
        </div>
        <p className="mt-1 text-[9px] text-muted/30">
          Type in any language — it will be polished into professional English + Farsi
        </p>
      </div>
    </div>
  );
}

// ─── Polish result card ─────────────────────────────────────

function PolishResultCard({ polished, farsi }: { polished: string; farsi: string }) {
  return (
    <div className="animate-slide-up rounded-2xl border border-primary/20 bg-primary-muted/30 p-5 shadow-xs">
      <div className="mb-1.5 flex items-center gap-1.5">
        <ArrowUpRight size={12} className="text-primary/60" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-primary/60">
          Polished Reply
        </span>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted/40">English</span>
          <CopyButton text={polished} />
        </div>
        <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">{polished}</p>
      </div>
      {farsi && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted/40">Farsi</span>
            <CopyButton text={farsi} />
          </div>
          <p dir="rtl" className="text-[13px] leading-relaxed text-foreground/80 whitespace-pre-wrap">{farsi}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────

export default function TranslatePage() {
  const { settings } = useSettings();
  const toast = useToast();

  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isReplyMode, setIsReplyMode] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [polishResults, setPolishResults] = useState<{ polished: string; farsi: string }[]>([]);
  const [lastOriginalText, setLastOriginalText] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const dragCountRef = useRef(0);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
    }
  }, [text]);

  // Scroll to latest result
  useEffect(() => {
    resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [results, polishResults]);

  // Drag & drop
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCountRef.current++;
      if (e.dataTransfer?.types.includes("Files")) setDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCountRef.current--;
      if (dragCountRef.current === 0) setDragging(false);
    };
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCountRef.current = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length === 0) return;
      const base64List = await Promise.all(files.map(readFileAsBase64));
      setImages((prev) => [...prev, ...base64List]);
    };
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  // Paste handler
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      const base64List = await Promise.all(imageFiles.map(readFileAsBase64));
      setImages((prev) => [...prev, ...base64List]);
    }
  }, []);

  // Check for Slack translate request
  useEffect(() => {
    const raw = sessionStorage.getItem("lii-slack-translate");
    if (!raw) return;
    sessionStorage.removeItem("lii-slack-translate");
    try {
      const data = JSON.parse(raw);
      if (data.text) {
        setText(data.text);
        setTimeout(() => handleTranslate(data.text), 100);
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getProviderConfig = useCallback(() => {
    const provider = settings.activeProvider;
    const apiKey = settings.providers[provider]?.apiKey;
    const modelId = settings.activeModel;
    if (!apiKey) throw new Error("No API key configured. Go to Settings.");
    return { provider, apiKey, modelId };
  }, [settings]);

  // Translate text
  const handleTranslate = useCallback(async (inputText?: string) => {
    const t = inputText || text.trim();
    if (!t && images.length === 0) return;
    setError("");
    setTranslating(true);

    try {
      const { provider, apiKey, modelId } = getProviderConfig();

      let parsed;
      if (images.length > 0) {
        parsed = await translateImageDirect({
          provider, apiKey, modelId,
          imageBase64: images,
          detectTone: settings.autoDetectTone,
          rules: settings.rules,
        });
      } else {
        parsed = await translateDirect({
          provider, apiKey, modelId,
          text: t,
          detectTone: settings.autoDetectTone,
          rules: settings.rules,
        });
      }

      const result: TranslationResult = {
        id: Date.now().toString(),
        originalText: parsed.originalText || parsed.extractedText || t,
        translatedText: parsed.translation || "",
        direction: parsed.direction || undefined,
        tone: parsed.tone,
        suggestedResponses: parsed.suggestedResponses,
        needsResponse: parsed.needsResponse,
        source: images.length > 0 ? "image" : "text",
        images: images.length > 0 ? [...images] : undefined,
        timestamp: Date.now(),
      };

      setResults((prev) => [...prev, result]);
      setLastOriginalText(t);
      setText("");
      setImages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  }, [text, images, settings, getProviderConfig]);

  // Polish reply
  const handlePolish = useCallback(async () => {
    const t = text.trim();
    if (!t) return;
    setError("");
    setTranslating(true);

    try {
      const { provider, apiKey, modelId } = getProviderConfig();
      const result = await polishReplyDirect({
        provider, apiKey, modelId,
        draft: t,
        originalMessage: lastOriginalText,
        rules: settings.rules,
      });

      setPolishResults((prev) => [...prev, result]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to polish reply");
    } finally {
      setTranslating(false);
    }
  }, [text, lastOriginalText, getProviderConfig]);

  const handleSend = useCallback(() => {
    if (translating) return;
    if (isReplyMode) {
      handlePolish();
    } else {
      handleTranslate();
    }
  }, [translating, isReplyMode, handlePolish, handleTranslate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUseSuggestion = useCallback((s: string) => {
    setText(s);
    setIsReplyMode(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleClear = useCallback(() => {
    setResults([]);
    setPolishResults([]);
    setLastOriginalText("");
    setText("");
    setImages([]);
    setError("");
  }, []);

  const hasContent = text.trim() || images.length > 0;
  const hasResults = results.length > 0 || polishResults.length > 0;

  return (
    <div className="flex h-full flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Results area */}
        <main className="flex-1 overflow-y-auto chat-scroll">
          <div className="mx-auto max-w-2xl px-3 py-3 md:px-4 md:py-5">
            {/* Empty state */}
            {!hasResults && !translating && (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in md:py-20">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-surface-hover md:mb-5 md:h-16 md:w-16">
                  <Languages size={24} className="text-primary/50 md:hidden" />
                  <Languages size={28} className="text-primary/50 hidden md:block" />
                </div>
                <h2 className="text-[15px] font-semibold text-foreground/80 mb-1 md:text-lg md:mb-1.5">Translate</h2>
                <p className="max-w-[280px] text-[13px] text-muted/50 leading-relaxed md:text-sm">
                  Paste text or screenshots — English↔Farsi translation, tone analysis, and reply suggestions
                </p>
                <div className="mt-4 flex items-center gap-3 text-[10px] text-muted/30 md:mt-5">
                  <span className="hidden items-center gap-1 md:flex">
                    <kbd className="rounded border border-border-subtle px-1 py-0.5 font-mono text-[9px]">⌘V</kbd>
                    paste text
                  </span>
                  <span className="hidden h-3 w-px bg-border-subtle md:block" />
                  <span className="flex items-center gap-1">
                    <ImagePlus size={10} />
                    drop image
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 animate-slide-up rounded-xl bg-danger-light p-3 text-sm text-danger">
                {error}
              </div>
            )}

            {/* Results */}
            <div className="space-y-4">
              {results.map((r) => (
                <ResultCard
                  key={r.id}
                  result={r}
                  onReply={handleUseSuggestion}
                  onUseSuggestion={handleUseSuggestion}
                />
              ))}
              {polishResults.map((r, i) => (
                <PolishResultCard key={`polish-${i}`} polished={r.polished} farsi={r.farsi} />
              ))}
            </div>

            {/* Translating indicator */}
            {translating && (
              <div className="mt-4 flex justify-center">
                <div className="animate-slide-up flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 shadow-xs">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span className="text-[12px] text-muted/60">
                    {isReplyMode ? "Polishing reply…" : "Translating…"}
                  </span>
                </div>
              </div>
            )}

            <div ref={resultsEndRef} />
          </div>
        </main>

        {/* Input area */}
        <div className="border-t border-border-subtle bg-background px-3 py-2 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px)+0.5rem)] md:px-4 md:py-3 md:pb-3">
          {/* Drop overlay */}
          {dragging && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="animate-scale-in rounded-xl border-2 border-dashed border-primary bg-card px-12 py-10 text-center shadow-lg">
                <ImagePlus size={40} className="mx-auto mb-3 text-primary" />
                <p className="text-base font-medium">Drop images here</p>
                <p className="text-xs text-muted">PNG, JPG, WebP</p>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-2xl">
            {/* Image previews */}
            {images.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className="group relative">
                    <img
                      src={img}
                      alt={`Image ${i + 1}`}
                      className="h-11 w-11 rounded-lg border border-border object-cover md:h-12 md:w-12"
                    />
                    <button
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white transition-opacity md:h-4 md:w-4"
                    >
                      <X size={10} className="md:hidden" />
                      <X size={8} className="hidden md:block" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Reply mode indicator */}
            {isReplyMode && (
              <div className="mb-2 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-primary-muted px-2.5 py-1 text-[11px] font-medium text-primary">
                  <ArrowUpRight size={11} />
                  Composing reply
                </span>
                <button
                  onClick={() => setIsReplyMode(false)}
                  className="text-[11px] text-muted hover:text-foreground transition-colors"
                >
                  Switch to translate
                </button>
              </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-1.5 md:gap-2">
              <div className="mb-0.5 flex shrink-0 flex-col gap-1 md:mb-1">
                <button
                  onClick={() => setIsReplyMode(!isReplyMode)}
                  className={cn(
                    "shrink-0 rounded-lg p-2.5 transition-colors press md:p-2",
                    isReplyMode
                      ? "bg-primary-muted text-primary"
                      : "text-muted hover:bg-accent hover:text-foreground"
                  )}
                  title={isReplyMode ? "Switch to translate" : "Switch to reply"}
                >
                  {isReplyMode ? <ArrowUpRight size={18} /> : <Languages size={18} />}
                </button>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="mb-0.5 shrink-0 rounded-lg p-2.5 text-muted hover:bg-accent hover:text-foreground transition-colors press md:mb-1 md:p-2"
                title="Upload image"
              >
                <ImagePlus size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    const base64List = await Promise.all(files.map(readFileAsBase64));
                    setImages((prev) => [...prev, ...base64List]);
                  }
                  e.target.value = "";
                }}
                className="hidden"
              />

              <div className={cn(
                "flex-1 overflow-hidden rounded-xl border bg-card transition-all focus-within:ring-1 focus-within:ring-primary/10",
                isReplyMode
                  ? "border-primary/30 focus-within:border-primary/50"
                  : "border-border focus-within:border-primary/40"
              )}>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  placeholder={isReplyMode ? "Write your reply… (Farsi, Finglish, or English)" : "Paste text in any language or drop a screenshot…"}
                  dir="auto"
                  rows={1}
                  className="w-full resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-relaxed placeholder-muted focus:outline-none"
                  style={{ maxHeight: 150 }}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!hasContent || translating}
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-background transition-all hover:bg-primary-hover disabled:opacity-30 press md:mb-1 md:h-9 md:w-9"
                title={`${isReplyMode ? "Polish reply" : "Translate"} (⌘↵)`}
              >
                {translating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isReplyMode ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>

            {/* Bottom bar */}
            <div className="mt-1.5 flex items-center justify-between">
              <div className="hidden items-center gap-1.5 text-[10px] text-muted/40 md:flex">
                <kbd className="rounded border border-border-subtle px-1 py-0.5 font-mono text-[9px]">↵</kbd>
                <span>{isReplyMode ? "polish" : "translate"}</span>
                <span className="text-muted/20">·</span>
                <kbd className="rounded border border-border-subtle px-1 py-0.5 font-mono text-[9px]">⇧↵</kbd>
                <span>new line</span>
              </div>
              {hasResults && (
                <button
                  onClick={handleClear}
                  className="text-[10px] text-muted/40 hover:text-muted/70 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
