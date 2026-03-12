"use client";
import { useRef, useState, useCallback } from "react";
import { Clipboard, ImagePlus, Loader2 } from "lucide-react";

interface TranslateInputProps {
  onTranslate: (text: string) => void;
  onImageUpload: (base64: string) => void;
  loading: boolean;
}

export default function TranslateInput({
  onTranslate,
  onImageUpload,
  loading,
}: TranslateInputProps) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => onImageUpload(reader.result as string);
            reader.readAsDataURL(file);
          }
          return;
        }
      }
    },
    [onImageUpload]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onImageUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
        textareaRef.current?.focus();
      }
    } catch {
      // Clipboard API not available
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) {
      e.preventDefault();
      onTranslate(text);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => onImageUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="relative"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Type or paste English text here... (or paste an image)"
          dir="ltr"
          className="w-full rounded-xl border border-border bg-card p-4 text-base leading-relaxed placeholder-muted focus:border-primary focus:outline-none"
          rows={5}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePasteFromClipboard}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-accent hover:text-foreground"
        >
          <Clipboard size={14} />
          <span>Paste</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-accent hover:text-foreground"
        >
          <ImagePlus size={14} />
          <span>Image</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex-1" />

        <button
          onClick={() => text.trim() && onTranslate(text)}
          disabled={!text.trim() || loading}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Translate
        </button>
      </div>
    </div>
  );
}
