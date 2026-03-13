"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { Clipboard, ImagePlus, X, RotateCcw } from "lucide-react";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";

type TranslateStatus = "idle" | "loading" | "success";

interface TranslateInputProps {
  onTranslate: (text: string) => void;
  onImageUpload: (base64List: string[]) => void;
  onTextChange?: (text: string) => void;
  onClear?: () => void;
  loading: boolean;
  status?: TranslateStatus;
  showClear?: boolean;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TranslateInput({
  onTranslate,
  onImageUpload,
  onTextChange,
  onClear,
  loading,
  status = "idle",
  showClear = false,
}: TranslateInputProps) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCountRef = useRef(0);

  // Full-page drag & drop
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCountRef.current++;
      if (e.dataTransfer?.types.includes("Files")) setDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCountRef.current--;
      if (dragCountRef.current === 0) setDragging(false);
    };
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCountRef.current = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length === 0) return;
      const base64List = await Promise.all(files.map(readFileAsBase64));
      setImages((prev) => [...prev, ...base64List]);
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handleTextUpdate = useCallback(
    (val: string) => {
      setText(val);
      onTextChange?.(val);
    },
    [onTextChange]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        const base64List = await Promise.all(imageFiles.map(readFileAsBase64));
        setImages((prev) => [...prev, ...base64List]);
      } else {
        // Text paste — notify parent on next tick after textarea updates
        setTimeout(() => {
          if (textareaRef.current) {
            onTextChange?.(textareaRef.current.value);
          }
        }, 0);
      }
    },
    [onTextChange]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const base64List = await Promise.all(files.map(readFileAsBase64));
      setImages((prev) => [...prev, ...base64List]);
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        handleTextUpdate(clipText);
        textareaRef.current?.focus();
      }
    } catch {
      // Clipboard API not available
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (images.length > 0) {
        onImageUpload(images);
        setImages([]);
      } else if (text.trim()) {
        onTranslate(text);
      }
    }
  };

  const handleTranslateClick = () => {
    if (images.length > 0) {
      onImageUpload(images);
      setImages([]);
    } else if (text.trim()) {
      onTranslate(text);
    }
  };

  const handleClear = () => {
    setText("");
    setImages([]);
    onClear?.();
    textareaRef.current?.focus();
  };

  const hasContent = text.trim() || images.length > 0;

  return (
    <div>
      {/* Drop overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="animate-scale-in rounded-xl border-2 border-dashed border-primary bg-card px-12 py-10 text-center shadow-lg">
            <ImagePlus size={40} className="mx-auto mb-3 text-primary" />
            <p className="text-base font-medium">Drop images here</p>
            <p className="text-xs text-muted">PNG, JPG, WebP</p>
          </div>
        </div>
      )}

      {/* Input card */}
      <div
        className={`overflow-hidden rounded-xl border bg-card transition-all ${
          loading
            ? "border-primary/30"
            : "border-border focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10"
        }`}
      >
        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleTextUpdate(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Paste or type English text..."
          dir="ltr"
          className="w-full border-0 bg-transparent p-4 pb-2 text-[15px] leading-relaxed placeholder-muted focus:outline-none"
          rows={images.length > 0 ? 2 : 3}
        />

        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {images.map((img, i) => (
              <div key={i} className="group relative">
                <img
                  src={img}
                  alt={`Image ${i + 1}`}
                  className="h-14 w-14 rounded-lg border border-border object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={8} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-1 border-t border-border-subtle px-3 py-1.5">
          <button
            onClick={handlePasteFromClipboard}
            className="rounded-lg p-2 text-muted hover:bg-accent hover:text-foreground"
            title="Paste from clipboard"
          >
            <Clipboard size={14} />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg p-2 text-muted hover:bg-accent hover:text-foreground"
            title="Upload image"
          >
            <ImagePlus size={14} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {showClear && (
            <button
              onClick={handleClear}
              className="rounded-lg p-2 text-muted hover:bg-accent hover:text-foreground"
              title="New translation"
            >
              <RotateCcw size={14} />
            </button>
          )}

          <div className="flex-1" />

          {/* Shortcut hint */}
          <div className="mr-1.5 hidden items-center gap-0.5 text-[10px] text-muted/60 sm:flex">
            <kbd className="rounded border border-border-subtle px-1 py-0.5 font-mono text-[9px]">
              ⌘
            </kbd>
            <kbd className="rounded border border-border-subtle px-1 py-0.5 font-mono text-[9px]">
              ↵
            </kbd>
          </div>

          {/* Translate button */}
          <InteractiveHoverButton
            text={
              images.length > 0
                ? `Translate ${images.length} image${images.length > 1 ? "s" : ""}`
                : "Translate"
            }
            loadingText="Translating..."
            successText="Done!"
            status={loading ? "loading" : status}
            disabled={!hasContent || loading}
            onClick={handleTranslateClick}
          />
        </div>
      </div>
    </div>
  );
}
