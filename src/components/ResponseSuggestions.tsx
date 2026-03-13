"use client";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { BilingualSuggestion } from "@/types";
import { useToast } from "./Toast";

interface ResponseSuggestionsProps {
  suggestions: BilingualSuggestion[];
}

export default function ResponseSuggestions({
  suggestions,
}: ResponseSuggestionsProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const toast = useToast();

  const handleCopy = async (english: string, idx: number) => {
    const textToCopy = english || suggestions[idx].farsi;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedIdx(idx);
    toast.success("Copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!suggestions.length) return null;

  return (
    <div className="animate-slide-up space-y-2">
      <p className="text-xs font-medium text-muted">Suggested replies</p>
      {suggestions.map((s, i) => (
        <div
          key={i}
          className="card-hover group flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/30"
        >
          {/* Number badge */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-muted">
            {i + 1}
          </span>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {s.english && (
              <p dir="ltr" className="text-sm leading-relaxed text-foreground">
                {s.english}
              </p>
            )}
            {s.farsi && (
              <p
                className="rtl mt-0.5 text-[13px] leading-relaxed text-muted"
                style={{
                  fontFamily: "var(--font-vazirmatn), system-ui, sans-serif",
                }}
              >
                {s.farsi}
              </p>
            )}
          </div>

          {/* Copy button */}
          <button
            onClick={() => handleCopy(s.english, i)}
            className="shrink-0 rounded-lg p-1.5 text-muted opacity-60 hover:bg-accent hover:text-foreground hover:opacity-100"
            title="Copy English reply"
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
  );
}
