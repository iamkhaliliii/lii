"use client";
import { Copy, BookmarkPlus, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "./Toast";

interface TranslationResultProps {
  translatedText: string;
  onSave?: () => void;
  provider?: string;
}

export default function TranslationResult({
  translatedText,
  onSave,
  provider,
}: TranslationResultProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave?.();
    setSaved(true);
    toast.success("Saved to history");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-slide-up rounded-xl border border-border bg-card">
      {/* Translation text */}
      <div className="p-5">
        <p
          className="rtl border-l-2 border-primary/20 pl-4 text-[17px] leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "var(--font-vazirmatn), system-ui, sans-serif" }}
        >
          {translatedText}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-border-subtle px-4 py-2.5">
        {/* Provider pill */}
        {provider && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted">
            {provider}
          </span>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-0.5">
          <button
            onClick={handleCopy}
            className="rounded-lg p-2 text-muted hover:bg-accent hover:text-foreground"
            title="Copy translation"
          >
            {copied ? (
              <Check size={15} className="text-success" />
            ) : (
              <Copy size={15} />
            )}
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              className="rounded-lg p-2 text-muted hover:bg-accent hover:text-foreground"
              title="Save to history"
            >
              {saved ? (
                <Check size={15} className="text-success" />
              ) : (
                <BookmarkPlus size={15} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
