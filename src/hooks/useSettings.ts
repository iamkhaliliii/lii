"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { AppSettings } from "@/types";
import {
  getSettings,
  updateSettings as updateSettingsLib,
  loadSettingsFromServer,
} from "@/lib/settings";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const handler = () => setSettings(getSettings());
    window.addEventListener("lii-settings-changed", handler);

    // On mount, load from server (web) or localStorage (Tauri)
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadSettingsFromServer()
        .then((loaded) => setSettings(loaded))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    return () => window.removeEventListener("lii-settings-changed", handler);
  }, []);

  const update = useCallback((partial: Partial<AppSettings>) => {
    const updated = updateSettingsLib(partial);
    setSettings(updated);
  }, []);

  return { settings, updateSettings: update, isLoading };
}
