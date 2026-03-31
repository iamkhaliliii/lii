"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  const handleClearAndReload = () => {
    try {
      // Clear potentially corrupted settings
      localStorage.removeItem("lii-settings");
      localStorage.removeItem("lii-conversations");
      localStorage.removeItem("lii-contacts");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Something went wrong</h2>
        <p className="text-sm text-muted/60 mb-1">
          {error.message || "An unexpected error occurred"}
        </p>
        <p className="text-[11px] text-muted/40 mb-6">
          This usually happens after an app update. Try refreshing or clearing data.
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-primary-hover"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
          <button
            onClick={handleClearAndReload}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent"
          >
            <Trash2 size={14} />
            Clear & Reload
          </button>
        </div>
      </div>
    </div>
  );
}
