"use client";
import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Gauge,
  Smile,
  User,
  ArrowUpRight,
  MessageCircleReply,
  Info,
  PenLine,
} from "lucide-react";
import { ChatMessage, BilingualSuggestion } from "@/types";
import { useToast } from "./Toast";

/** Render **bold** markdown as <strong> tags */
function renderBoldMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function stripBold(text: string) {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through
    }
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onUseSuggestion?: (text: string) => void;
  animationDelay?: number;
}

export default function ChatMessageBubble({
  message,
  onUseSuggestion,
  animationDelay = 0,
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [copiedSuggIdx, setCopiedSuggIdx] = useState<number | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const toast = useToast();

  const isIncoming = message.direction === "incoming";

  const handleCopy = async () => {
    const text = isIncoming
      ? stripBold(message.translatedText)
      : message.polishedReply || message.originalText;
    await copyToClipboard(text);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySuggestion = async (english: string, idx: number) => {
    await copyToClipboard(english);
    setCopiedSuggIdx(idx);
    toast.success("Copied!");
    setTimeout(() => setCopiedSuggIdx(null), 2000);
  };

  const renderedTranslation = useMemo(
    () => renderBoldMarkdown(message.translatedText),
    [message.translatedText]
  );

  const time = new Date(message.timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isIncoming) {
    return (
      <div className="animate-bubble-in flex justify-start" style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}>
        <div className="max-w-[88%] space-y-1.5">
          {/* Main bubble */}
          <div className="group relative rounded-2xl rounded-tl-sm border border-border bg-card shadow-xs overflow-hidden">
            {/* Original text — collapsible */}
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="w-full border-b border-border-subtle px-4 py-2 text-left transition-colors hover:bg-surface-hover"
            >
              <p
                dir="ltr"
                className={`text-xs leading-relaxed text-muted ${showOriginal ? "" : "line-clamp-1"}`}
              >
                {message.originalText}
              </p>
            </button>

            {/* Farsi translation — main content */}
            <div className="px-4 py-3">
              <p
                className="rtl text-[15px] leading-[1.85] whitespace-pre-wrap text-foreground"
                style={{
                  fontFamily: "var(--font-vazirmatn), system-ui, sans-serif",
                }}
              >
                {renderedTranslation}
              </p>
            </div>

            {/* Tone pills — subtle separator */}
            {message.tone && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle/50 px-4 py-2">
                <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Gauge size={9} />
                  {message.tone.formality}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Smile size={9} />
                  {message.tone.sentiment}
                </span>
                {message.tone.likelySender && (
                  <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <User size={9} />
                    {message.tone.likelySender}
                  </span>
                )}
                {message.tone.context && (
                  <span
                    className="rtl text-[10px] text-muted/70"
                    style={{
                      fontFamily:
                        "var(--font-vazirmatn), system-ui, sans-serif",
                    }}
                  >
                    · {message.tone.context}
                  </span>
                )}
              </div>
            )}

            {/* Footer — clean separator */}
            <div className="flex items-center gap-2 border-t border-border-subtle/50 px-4 py-1.5">
              {message.needsResponse ? (
                <span className="flex items-center gap-1 rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-medium text-primary">
                  <MessageCircleReply size={8} />
                  Reply needed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-muted/40">
                  <Info size={8} />
                  FYI
                </span>
              )}
              {message.provider && (
                <span className="text-[9px] text-muted/30">
                  {message.provider}
                </span>
              )}
              <div className="flex-1" />
              <span className="text-[10px] text-muted/30">{time}</span>
              <button
                onClick={handleCopy}
                className="rounded-md p-1 text-muted/40 opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
                title="Copy translation"
              >
                {copied ? (
                  <Check size={12} className="text-success" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          </div>

          {/* Suggested replies — floating chips */}
          {message.suggestedResponses &&
            message.suggestedResponses.length > 0 &&
            message.needsResponse && (
              <div className="flex flex-wrap gap-1.5 pl-1 pt-0.5">
                {message.suggestedResponses.map(
                  (s: BilingualSuggestion, i: number) => (
                    <div key={i} className="group/sugg relative animate-bubble-in" style={{ animationDelay: `${i * 80 + 100}ms` }}>
                      <button
                        onClick={() => onUseSuggestion?.(s.english)}
                        className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-foreground shadow-xs transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
                      >
                        <PenLine size={10} className="text-muted/50 group-hover/sugg:text-primary transition-colors" />
                        <span className="max-w-[200px] truncate">
                          {s.english}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopySuggestion(s.english, i);
                          }}
                          className="ml-0.5 cursor-pointer rounded p-0.5 text-muted/30 opacity-0 transition-all hover:text-foreground group-hover/sugg:opacity-100"
                          title="Copy"
                        >
                          {copiedSuggIdx === i ? (
                            <Check size={10} className="text-success" />
                          ) : (
                            <Copy size={10} />
                          )}
                        </span>
                      </button>
                      {/* Farsi tooltip on hover */}
                      {s.farsi && (
                        <div className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-[11px] text-background opacity-0 shadow-md transition-opacity duration-200 group-hover/sugg:opacity-100"
                          style={{ fontFamily: "var(--font-vazirmatn), system-ui, sans-serif" }}
                        >
                          {s.farsi}
                          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground" />
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
        </div>
      </div>
    );
  }

  // Outgoing message
  return (
    <div className="animate-bubble-in flex justify-end" style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}>
      <div className="max-w-[85%]">
        <div className="group relative rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-white shadow-sm">
          {/* Polished reply */}
          {message.polishedReply && (
            <p dir="ltr" className="text-sm leading-relaxed">
              {message.polishedReply}
            </p>
          )}

          {/* Farsi translation */}
          {message.translatedText && (
            <p
              className="rtl mt-1.5 text-[13px] leading-relaxed text-white/60"
              style={{
                fontFamily: "var(--font-vazirmatn), system-ui, sans-serif",
              }}
            >
              {message.translatedText}
            </p>
          )}

          {/* If no polished reply, show original */}
          {!message.polishedReply && !message.translatedText && (
            <p dir="ltr" className="text-sm leading-relaxed">
              {message.originalText}
            </p>
          )}

          {/* Original draft (if different from polished) */}
          {message.polishedReply &&
            message.originalText !== message.polishedReply && (
              <p
                dir="auto"
                className="mt-1 text-[11px] text-white/30 line-clamp-1"
              >
                Draft: {message.originalText}
              </p>
            )}

          {/* Footer */}
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-white/30">
              <ArrowUpRight size={9} />
              Polished
            </span>
            <div className="flex-1" />
            <span className="text-[10px] text-white/30">{time}</span>
            <button
              onClick={handleCopy}
              className="rounded-md p-1 text-white/30 opacity-0 transition-all hover:text-white group-hover:opacity-100"
              title="Copy"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
