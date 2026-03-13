"use client";
import { Languages } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-12 text-center">
      {/* Icon with gradient circle */}
      <div className="relative mb-5">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--primary-muted)" }}
        >
          <Languages size={28} className="text-primary" />
        </div>
      </div>

      <h3 className="mb-1.5 text-base font-semibold text-foreground">
        Translate anything
      </h3>
      <p className="mb-6 max-w-xs text-sm text-muted">
        Paste a message, screenshot, or type English text to get a Farsi
        translation with smart reply suggestions.
      </p>

      {/* Quick start steps */}
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-muted text-[10px] font-bold text-primary">
            1
          </span>
          Paste text
        </span>
        <span className="text-border">→</span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-muted text-[10px] font-bold text-primary">
            2
          </span>
          Select contact
        </span>
        <span className="text-border">→</span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-muted text-[10px] font-bold text-primary">
            3
          </span>
          Get translation
        </span>
      </div>
    </div>
  );
}
