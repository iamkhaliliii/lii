"use client";
import { useState, useEffect } from "react";
import { Download, X, Loader2 } from "lucide-react";
import { checkForAppUpdates } from "@/lib/updater";

export default function UpdateBanner() {
  const [update, setUpdate] = useState<Awaited<
    ReturnType<typeof checkForAppUpdates>
  > | null>(null);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkForAppUpdates().then(setUpdate);
  }, []);

  if (!update || dismissed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);
    try {
      await update.downloadAndInstall((p) => setProgress(p));
    } catch (e) {
      console.error("[updater] Install error:", e);
      setError(e instanceof Error ? e.message : "Update failed");
      setInstalling(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-primary/10 px-4 py-2 text-sm">
      <span>
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : (
          <>Update <strong>v{update.version}</strong> is available</>
        )}
      </span>
      <div className="flex items-center gap-2">
        {installing ? (
          <span className="flex items-center gap-1.5 text-primary">
            <Loader2 size={14} className="animate-spin" />
            {progress}%
          </span>
        ) : (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1 rounded bg-primary px-3 py-1 text-white hover:bg-primary-hover"
          >
            <Download size={14} />
            Update
          </button>
        )}
        {!installing && (
          <button
            onClick={() => setDismissed(true)}
            className="text-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
