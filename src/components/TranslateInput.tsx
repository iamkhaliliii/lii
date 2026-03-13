"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { Clipboard, ImagePlus, Loader2, X } from "lucide-react";

interface TranslateInputProps {
  onTranslate: (text: string) => void;
  onImageUpload: (base64List: string[]) => void;
  loading: boolean;
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
  loading,
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
      if (e.dataTransfer?.types.includes("Files")) {
        setDragging(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCountRef.current--;
      if (dragCountRef.current === 0) setDragging(false);
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
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

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
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
    }
  }, []);

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
        setText(clipText);
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

  return (
    <div className="space-y-3">
      {/* Drop overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-card px-12 py-10 text-center shadow-lg">
            <ImagePlus size={48} className="mx-auto mb-3 text-primary" />
            <p className="text-lg font-medium">Drop images here</p>
            <p className="text-sm text-muted">PNG, JPG, WebP</p>
          </div>
        </div>
      )}

      {/* Text input */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder="Type or paste English text here... (or drop/paste images)"
        dir="ltr"
        className="w-full rounded-xl border border-border bg-card p-4 text-base leading-relaxed placeholder-muted focus:border-primary focus:outline-none"
        rows={images.length > 0 ? 3 : 5}
      />

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="group relative">
              <img
                src={img}
                alt={`Image ${i + 1}`}
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
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
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex-1" />

        <button
          onClick={handleTranslateClick}
          disabled={(!text.trim() && images.length === 0) || loading}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Translate{images.length > 0 ? ` (${images.length} image${images.length > 1 ? "s" : ""})` : ""}
        </button>
      </div>
    </div>
  );
}
