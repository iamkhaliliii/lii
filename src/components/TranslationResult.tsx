"use client";
import { useState } from "react";
import { Copy, Check, BookmarkPlus } from "lucide-react";

interface TranslationResultProps {
  translation: string;
  onSave?: () => void;
}

export default function TranslationResult({
  translation,
  onSave,
}: TranslationResultProps) {
  const [copied, setCopied] = useState(false);

  if (!translation) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="rtl mb-3 text-base leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "var(--font-vazirmatn), system-ui, sans-serif" }}>
        {translation}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-accent hover:text-foreground"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
        {onSave && (
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-accent hover:text-foreground"
          >
            <BookmarkPlus size={14} />
            Save
          </button>
        )}
      </div>
    </div>
  );
}
