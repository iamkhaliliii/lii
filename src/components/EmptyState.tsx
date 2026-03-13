"use client";
import { Languages, ImagePlus, ArrowRight } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-center">
      {/* Icon composition */}
      <div className="relative mb-6">
        <div className="flex items-center gap-3 text-muted">
          <div className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <Languages size={28} className="text-primary" />
          </div>
          <ArrowRight size={20} className="text-border" />
          <div className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-vazirmatn), system-ui" }}>فا</span>
          </div>
        </div>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-foreground">
        Translate English to Persian
      </h2>
      <p className="mb-1 text-sm text-muted">
        Type or paste English text above to get started
      </p>
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <ImagePlus size={12} />
        <span>Or drop a screenshot for image translation</span>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="mt-6 flex items-center gap-1.5 text-xs text-muted">
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">⌘</kbd>
        <span>+</span>
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">Enter</kbd>
        <span className="ml-1">to translate</span>
      </div>
    </div>
  );
}
