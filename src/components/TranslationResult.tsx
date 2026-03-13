"use client";
import { Copy, Check, MessageCircleReply, Info, Gauge, Smile, User } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { ToneAnalysis } from "@/types";
import { useToast } from "./Toast";

/** Render **bold** markdown as <strong> tags, rest as text */
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

/** Strip **bold** markers for plain-text copy */
function stripBold(text: string) {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

/** Clipboard helper — fallback for WKWebView / insecure contexts */
async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to fallback
    }
  }
  // Fallback: textarea + execCommand
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

interface TranslationResultProps {
  translatedText: string;
  provider?: string;
  needsResponse?: boolean;
  tone?: ToneAnalysis | null;
}

export default function TranslationResult({
  translatedText,
  provider,
  needsResponse = true,
  tone,
}: TranslationResultProps) {
  const [copied, setCopied] = useState(false);
  const [showSaved, setShowSaved] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [translatedText]);

  const handleCopy = async () => {
    await copyToClipboard(stripBold(translatedText));
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const rendered = useMemo(() => renderBoldMarkdown(translatedText), [translatedText]);

  return (
    <div className="animate-slide-up rounded-xl border border-border bg-card overflow-hidden">
      {/* Translation */}
      <div className="px-4 pt-4 pb-3">
        <p
          className="rtl text-[15px] leading-[1.8] whitespace-pre-wrap text-foreground"
          style={{ fontFamily: "var(--font-vazirmatn), system-ui, sans-serif" }}
        >
          {rendered}
        </p>
      </div>

      {/* Tone & context — integrated */}
      {tone && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
          <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Gauge size={9} />
            {tone.formality}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Smile size={9} />
            {tone.sentiment}
          </span>
          {tone.likelySender && (
            <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <User size={9} />
              {tone.likelySender}
            </span>
          )}
          {tone.context && (
            <span
              className="rtl text-[10px] text-muted"
              style={{ fontFamily: "var(--font-vazirmatn), system-ui, sans-serif" }}
            >
              · {tone.context}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-border-subtle px-4 py-2">
        {/* Meta pills */}
        <div className="flex items-center gap-1.5">
          {provider && (
            <span className="text-[10px] text-muted/50">{provider}</span>
          )}

          {needsResponse ? (
            <span className="flex items-center gap-1 rounded-full bg-primary-muted px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <MessageCircleReply size={8} />
              Reply needed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted/50">
              <Info size={8} />
              FYI
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Saved indicator */}
        {showSaved && (
          <span className="flex items-center gap-1 text-[10px] text-success animate-fade-in">
            <Check size={9} />
            Saved
          </span>
        )}

        {/* Copy */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-accent hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check size={12} className="text-success" />
          ) : (
            <Copy size={12} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
