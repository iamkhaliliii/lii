"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { Send, ImagePlus, X, Loader2, ArrowUpRight, Languages } from "lucide-react";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface ChatInputProps {
  onSendText: (text: string) => void;
  onSendReply: (draft: string) => void;
  onSendImage: (base64List: string[]) => void;
  onTextChange?: (text: string) => void;
  sending: boolean;
  prefill?: string;
  onPrefillUsed?: () => void;
  placeholder?: string;
  /** When true, start in reply mode */
  replyMode?: boolean;
}

export default function ChatInput({
  onSendText,
  onSendReply,
  onSendImage,
  onTextChange,
  sending,
  prefill,
  onPrefillUsed,
  placeholder = "Paste a message or screenshot…",
  replyMode: initialReplyMode = false,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [isReplyMode, setIsReplyMode] = useState(initialReplyMode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCountRef = useRef(0);

  // Handle prefill from suggestion clicks → switch to reply mode
  useEffect(() => {
    if (prefill) {
      setText(prefill);
      setIsReplyMode(true);
      onPrefillUsed?.();
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [prefill, onPrefillUsed]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [text]);

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

  const handleSend = () => {
    if (sending) return;
    if (images.length > 0) {
      onSendImage(images);
      setImages([]);
      setText("");
    } else if (text.trim()) {
      if (isReplyMode) {
        onSendReply(text.trim());
      } else {
        onSendText(text.trim());
      }
      setText("");
      setIsReplyMode(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // ⌘↵ or Ctrl+↵ always sends
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
      return;
    }
    // Plain Enter sends (unless Shift is held for new line)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = text.trim() || images.length > 0;

  return (
    <div className="border-t border-border-subtle bg-background px-4 py-3">
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

      {/* Image previews */}
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="group relative">
              <img
                src={img}
                alt={`Image ${i + 1}`}
                className="h-12 w-12 rounded-lg border border-border object-cover"
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

      {/* Reply mode indicator */}
      {isReplyMode && (
        <div className="mb-2 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-primary-muted px-2.5 py-1 text-[11px] font-medium text-primary">
            <ArrowUpRight size={11} />
            Composing reply
          </span>
          <button
            onClick={() => setIsReplyMode(false)}
            className="text-[11px] text-muted hover:text-foreground transition-colors"
          >
            Switch to translate
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Mode toggle + image upload */}
        <div className="mb-1 flex shrink-0 flex-col gap-1">
          <button
            onClick={() => setIsReplyMode(!isReplyMode)}
            className={`shrink-0 rounded-lg p-2 transition-colors ${
              isReplyMode
                ? "bg-primary-muted text-primary"
                : "text-muted hover:bg-accent hover:text-foreground"
            }`}
            title={isReplyMode ? "Switch to translate mode" : "Switch to reply mode"}
          >
            {isReplyMode ? <ArrowUpRight size={16} /> : <Languages size={16} />}
          </button>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="mb-1 shrink-0 rounded-lg p-2 text-muted hover:bg-accent hover:text-foreground transition-colors"
          title="Upload image"
        >
          <ImagePlus size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className={`flex-1 overflow-hidden rounded-xl border bg-card transition-all focus-within:ring-1 focus-within:ring-primary/10 ${
          isReplyMode
            ? "border-primary/30 focus-within:border-primary/50"
            : "border-border focus-within:border-primary/40"
        }`}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextUpdate(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={isReplyMode ? "Write your reply… (Farsi, Finglish, or English)" : placeholder}
            dir="auto"
            rows={1}
            className="w-full resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-relaxed placeholder-muted focus:outline-none"
            style={{ maxHeight: 120 }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!hasContent || sending}
          className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-background transition-colors hover:bg-primary-hover disabled:opacity-30"
          title={`${isReplyMode ? "Polish & send" : "Translate"} (⌘↵)`}
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isReplyMode ? (
            <ArrowUpRight size={16} />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>

      {/* Shortcut hint */}
      <div className="mt-1 hidden items-center justify-end gap-1.5 text-[10px] text-muted/40 sm:flex">
        <kbd className="rounded border border-border-subtle px-1 py-0.5 font-mono text-[9px]">
          ↵
        </kbd>
        <span>{isReplyMode ? "polish" : "translate"}</span>
        <span className="text-muted/20">·</span>
        <kbd className="rounded border border-border-subtle px-1 py-0.5 font-mono text-[9px]">
          ⇧↵
        </kbd>
        <span>new line</span>
      </div>
    </div>
  );
}
