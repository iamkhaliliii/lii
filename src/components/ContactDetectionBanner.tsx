"use client";
import { useEffect, useState } from "react";
import { DetectionResult } from "@/lib/contact-detection";
import { UserCheck, UserPlus, X } from "lucide-react";

interface ContactDetectionBannerProps {
  match: DetectionResult;
  detectedName: string;
  onConfirmExact: () => void;
  onConfirmFuzzy: () => void;
  onCreateNew: () => void;
  onDismiss: () => void;
}

export default function ContactDetectionBanner({
  match,
  detectedName,
  onConfirmExact,
  onConfirmFuzzy,
  onCreateNew,
  onDismiss,
}: ContactDetectionBannerProps) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss exact matches after 3s
  useEffect(() => {
    if (match.type === "exact") {
      onConfirmExact();
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [match, onConfirmExact]);

  if (!visible) return null;

  if (match.type === "exact") {
    return (
      <div className="animate-slide-up flex items-center gap-2 rounded-xl bg-success-light px-3 py-2">
        <UserCheck size={14} className="shrink-0 text-success" />
        <span className="flex-1 text-xs text-foreground">
          Auto-assigned to <strong>{match.contact.name}</strong>
        </span>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 rounded p-0.5 text-muted hover:text-foreground"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  if (match.type === "fuzzy") {
    return (
      <div className="animate-slide-up flex items-center gap-2 rounded-xl bg-warning-light px-3 py-2">
        <UserCheck size={14} className="shrink-0 text-warning" />
        <span className="flex-1 text-xs text-foreground">
          Detected <strong>{detectedName}</strong> — Is this{" "}
          <strong>{match.contact.name}</strong>?
        </span>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onConfirmFuzzy}
            className="rounded-lg bg-foreground/5 px-2 py-1 text-[11px] font-medium hover:bg-foreground/10"
          >
            Yes
          </button>
          <button
            onClick={onCreateNew}
            className="rounded-lg bg-foreground/5 px-2 py-1 text-[11px] font-medium hover:bg-foreground/10"
          >
            New
          </button>
          <button
            onClick={onDismiss}
            className="rounded p-0.5 text-muted hover:text-foreground"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  if (match.type === "new") {
    return (
      <div className="animate-slide-up flex items-center gap-2 rounded-xl bg-primary-light px-3 py-2">
        <UserPlus size={14} className="shrink-0 text-primary" />
        <span className="flex-1 text-xs text-foreground">
          New contact: <strong>{detectedName}</strong>
        </span>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onCreateNew}
            className="rounded-lg bg-primary-muted px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/20"
          >
            Add Contact
          </button>
          <button
            onClick={onDismiss}
            className="rounded p-0.5 text-muted hover:text-foreground"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
