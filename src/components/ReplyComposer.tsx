"use client";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Copy,
  Check,
  Loader2,
  PenLine,
  ArrowUpRight,
} from "lucide-react";

/** Clipboard helper — fallback for WKWebView / insecure contexts */
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
import { BilingualSuggestion } from "@/types";
import { useToast } from "./Toast";

interface ReplyComposerProps {
  suggestions: BilingualSuggestion[];
  onPolish: (draft: string) => Promise<{ polished: string; farsi: string }>;
}

export default function ReplyComposer({
  suggestions,
  onPolish,
}: ReplyComposerProps) {
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<{
    polished: string;
    farsi: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedResult, setCopiedResult] = useState(false);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();

  // Auto-focus when composer opens
  useEffect(() => {
    if (composerOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [composerOpen]);

  const handleSubmit = async () => {
    if (!draft.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await onPolish(draft.trim());
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to polish reply");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopySuggestion = async (english: string, idx: number) => {
    const text = english || suggestions[idx]?.farsi || "";
    await copyToClipboard(text);
    setCopiedIdx(idx);
    toast.success("Copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyResult = async () => {
    if (!result) return;
    await copyToClipboard(result.polished);
    setCopiedResult(true);
    toast.success("Copied!");
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const handleUseSuggestion = (english: string) => {
    setDraft(english);
    setResult(null);
    setComposerOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="animate-slide-up space-y-2">
      <p className="text-xs font-medium text-muted">Reply</p>

      {/* ── Suggested replies ── */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="group flex items-start gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:border-primary/30"
            >
              {/* Click to use as draft */}
              <button
                onClick={() => handleUseSuggestion(s.english)}
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-muted transition-colors hover:bg-primary hover:text-white"
                title="Edit this reply"
              >
                <PenLine size={10} />
              </button>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {s.english && (
                  <p
                    dir="ltr"
                    className="text-sm leading-relaxed text-foreground"
                  >
                    {s.english}
                  </p>
                )}
                {s.farsi && (
                  <p
                    className="rtl mt-0.5 text-[13px] leading-relaxed text-muted"
                    style={{
                      fontFamily:
                        "var(--font-vazirmatn), system-ui, sans-serif",
                    }}
                  >
                    {s.farsi}
                  </p>
                )}
              </div>

              {/* Copy */}
              <button
                onClick={() => handleCopySuggestion(s.english, i)}
                className="shrink-0 rounded-lg p-1.5 text-muted opacity-50 transition-opacity hover:bg-accent hover:text-foreground hover:opacity-100"
                title="Copy"
              >
                {copiedIdx === i ? (
                  <Check size={13} className="text-success" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Polished result ── */}
      {result && (
        <div className="animate-slide-up rounded-lg border border-primary/25 bg-primary-light p-2.5">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <ArrowUpRight size={10} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                dir="ltr"
                className="text-sm leading-relaxed text-foreground"
              >
                {result.polished}
              </p>
              {result.farsi && (
                <p
                  className="rtl mt-0.5 text-[13px] leading-relaxed text-muted"
                  style={{
                    fontFamily:
                      "var(--font-vazirmatn), system-ui, sans-serif",
                  }}
                >
                  {result.farsi}
                </p>
              )}
            </div>
            <button
              onClick={handleCopyResult}
              className="shrink-0 rounded-lg p-1.5 text-muted transition-opacity hover:bg-accent hover:text-foreground"
              title="Copy"
            >
              {copiedResult ? (
                <Check size={13} className="text-success" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Composer input ── */}
      {!composerOpen ? (
        <button
          onClick={() => setComposerOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted transition-colors hover:border-primary/30 hover:text-foreground"
        >
          <PenLine size={13} />
          Write your own reply…
        </button>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card transition-all focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (result) setResult(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Farsi, Finglish, or English…"
            dir="auto"
            className="w-full border-0 bg-transparent px-3 pt-2.5 pb-1.5 text-sm leading-relaxed placeholder-muted focus:outline-none"
            rows={2}
          />
          <div className="flex items-center gap-1.5 px-2.5 pb-2">
            <div className="flex-1" />

            {/* ⌘↵ hint */}
            <div className="mr-1 hidden items-center gap-0.5 text-[10px] text-muted/50 sm:flex">
              <kbd className="rounded border border-border-subtle px-1 py-0.5 font-mono text-[9px]">
                ⌘
              </kbd>
              <kbd className="rounded border border-border-subtle px-1 py-0.5 font-mono text-[9px]">
                ↵
              </kbd>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!draft.trim() || loading}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-30"
            >
              {loading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Send size={11} />
              )}
              {loading ? "Polishing…" : "Polish"}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
