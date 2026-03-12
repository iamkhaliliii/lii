"use client";
import { useState, useEffect, useCallback } from "react";
import { AppSettings } from "@/types";
import { getSettings, updateSettings as updateSettingsLib } from "@/lib/settings";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  useEffect(() => {
    const handler = () => setSettings(getSettings());
    window.addEventListener("lii-settings-changed", handler);
    return () => window.removeEventListener("lii-settings-changed", handler);
  }, []);

  const update = useCallback((partial: Partial<AppSettings>) => {
    const updated = updateSettingsLib(partial);
    setSettings(updated);
  }, []);

  return { settings, updateSettings: update };
}
