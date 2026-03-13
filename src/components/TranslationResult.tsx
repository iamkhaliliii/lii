"use client";
import { Copy, BookmarkPlus, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "./Toast";

interface TranslationResultProps {
  translation: string;
  onSave?: () => void;
  providerName?: string;
}

export default function TranslationResult({
  translation,
  onSave,
  providerName,
}: TranslationResultProps) {
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  if (!translation) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translation);
    toast.success("Translation copied!");
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
      setSaved(true);
      toast.success("Saved to history!");
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div
      className="animate-slide-up overflow-hidden rounded-2xl border border-border bg-card"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Accent left border */}
      <div className="flex">
        <div
          className="w-1 shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="min-w-0 flex-1 p-5">
          {/* Translation text */}
          <div
            className="rtl mb-4 text-lg leading-relaxed whitespace-pre-wrap"
            style={{
              fontFamily: "var(--font-vazirmatn), system-ui, sans-serif",
            }}
          >
            {translation}
          </div>

          {/* Actions bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-accent hover:text-foreground"
            >
              <Copy size={14} />
              Copy
            </button>
            {onSave && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-accent hover:text-foreground"
              >
                {saved ? (
                  <Check size={14} className="text-success" />
                ) : (
                  <BookmarkPlus size={14} />
                )}
                {saved ? "Saved" : "Save"}
              </button>
            )}

            {/* Provider pill */}
            {providerName && (
              <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-muted">
                {providerName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
