"use client";
import { Sparkles, Copy, Check } from "lucide-react";
import { useState } from "react";
import { BilingualSuggestion } from "@/types";
import { useToast } from "./Toast";

interface ResponseSuggestionsProps {
  suggestions: BilingualSuggestion[];
}

export default function ResponseSuggestions({
  suggestions,
}: ResponseSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const toast = useToast();

  if (!suggestions.length) return null;

  const handleCopy = async (
    suggestion: BilingualSuggestion,
    index: number
  ) => {
    // Copy English text (what user actually sends)
    const textToCopy = suggestion.english || suggestion.farsi;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    toast.success("Copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="animate-slide-up stagger-3 rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
        <Sparkles size={14} className="text-primary" />
        Suggested Replies
      </h3>
      <div className="space-y-2">
        {suggestions.map((suggestion, i) => (
          <div
            key={i}
            className="card-hover group flex items-start gap-3 rounded-xl bg-accent p-3"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              {/* English text (prominent, what gets copied/sent) */}
              {suggestion.english && (
                <p
                  dir="ltr"
                  className="text-sm font-medium leading-relaxed text-foreground"
                >
                  {suggestion.english}
                </p>
              )}
              {/* Farsi translation (secondary, helps user understand) */}
              {suggestion.farsi && (
                <p
                  className="rtl text-xs leading-relaxed text-muted"
                  style={{
                    fontFamily: "var(--font-vazirmatn), system-ui, sans-serif",
                  }}
                >
                  {suggestion.farsi}
                </p>
              )}
            </div>
            <button
              onClick={() => handleCopy(suggestion, i)}
              className="shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition-opacity hover:bg-card hover:text-foreground group-hover:opacity-100"
              title="Copy English reply"
            >
              {copiedIndex === i ? (
                <Check size={14} className="text-success" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
