"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface ResponseSuggestionsProps {
  suggestions: string[];
}

export default function ResponseSuggestions({
  suggestions,
}: ResponseSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!suggestions.length) return null;

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted">Suggested Responses</h3>
      <div className="space-y-2">
        {suggestions.map((text, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg bg-accent p-3"
          >
            <span className="rtl flex-1 text-sm leading-relaxed" style={{ fontFamily: "var(--font-vazirmatn), system-ui, sans-serif" }}>{text}</span>
            <button
              onClick={() => handleCopy(text, i)}
              className="shrink-0 rounded p-1 text-muted hover:text-foreground"
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
