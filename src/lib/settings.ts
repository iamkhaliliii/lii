import { AIProvider, AppSettings } from "@/types";
import { isTauri } from "./auth";

const SETTINGS_KEY = "lii-settings";
const TAURI_STORE_NAME = "settings.json";

const defaultSettings: AppSettings = {
  providers: {
    openai: { apiKey: "", defaultModel: "gpt-4o-mini" },
    anthropic: { apiKey: "", defaultModel: "claude-sonnet" },
    google: { apiKey: "", defaultModel: "gemini-2-flash" },
  },
  activeProvider: "openai",
  activeModel: "gpt-4o-mini",
  autoDetectTone: true,
  autoSuggestResponse: true,
  theme: "system",
  slack: { token: "", connected: false },
  elevenLabsApiKey: "",
  ttsAccent: "us",
  ttsEngine: "elevenlabs",
  ttsElevenLabsVoiceUs: "",
  ttsElevenLabsVoiceGb: "",
  ttsElevenLabsSpeed: 1,
  rules: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tauriStoreInstance: any = null;

async function getTauriSettingsStore() {
  if (!tauriStoreInstance) {
    const { load } = await import("@tauri-apps/plugin-store");
    tauriStoreInstance = await load(TAURI_STORE_NAME, { defaults: {}, autoSave: false });
  }
  return tauriStoreInstance;
}

async function saveTauriSettings(settings: AppSettings): Promise<void> {
  try {
    const store = await getTauriSettingsStore();
    await store.set("appSettings", settings);
    await store.save();
  } catch { /* ignore */ }
}

async function loadTauriSettings(): Promise<AppSettings | null> {
  try {
    const store = await getTauriSettingsStore();
    return await store.get("appSettings") || null;
  } catch {
    return null;
  }
}

export async function initTauriSettings(): Promise<void> {
  if (!isTauri()) return;

  const local = getLocalSettings();
  const persisted = await loadTauriSettings();

  if (!persisted) {
    await saveTauriSettings(local);
    return;
  }

  const localHasContent = local.slack?.token || Object.values(local.providers).some(p => p.apiKey);

  if (localHasContent) {
    const merged: AppSettings = {
      ...persisted,
      ...local,
      slack: {
        token: "",
        connected: false,
        ...persisted.slack,
        ...local.slack,
        pinnedChannels: local.slack?.pinnedChannels?.length
          ? local.slack.pinnedChannels
          : persisted.slack?.pinnedChannels || [],
      },
    };
    setLocalSettings(merged);
    await saveTauriSettings(merged);
  } else {
    setLocalSettings(persisted);
  }
}

// ─── Runtime mode detection ───────────────────────────────────
function isWebMode(): boolean {
  return (
    typeof window !== "undefined" &&
    !isTauri() &&
    process.env.NEXT_PUBLIC_STATIC_EXPORT !== "true"
  );
}

// ─── localStorage functions ───────────────────────────────────
function getLocalSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    return defaultSettings;
  }
}

function setLocalSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("lii-settings-changed"));
}

// ─── API functions (web mode only) ────────────────────────────
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("lii-auth");
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user.token || null;
  } catch {
    return null;
  }
}

async function fetchSettingsFromAPI(): Promise<AppSettings | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch("/api/settings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.settings || null;
  } catch {
    return null;
  }
}

async function saveSettingsToAPI(settings: AppSettings): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Public API (synchronous for backward compat) ─────────────
export function getSettings(): AppSettings {
  return getLocalSettings();
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getLocalSettings();
  const updated = { ...current, ...partial };
  setLocalSettings(updated);

  if (isTauri()) {
    saveTauriSettings(updated).catch(() => {});
  } else if (isWebMode()) {
    saveSettingsToAPI(updated).catch(() => {});
  }

  return updated;
}

// ─── Async functions for hook usage ───────────────────────────
export async function loadSettingsFromServer(): Promise<AppSettings> {
  if (isTauri()) {
    await initTauriSettings();
    return getLocalSettings();
  }

  if (!isWebMode()) {
    return getLocalSettings();
  }

  const remote = await fetchSettingsFromAPI();
  if (remote) {
    setLocalSettings(remote);
    return remote;
  }

  return getLocalSettings();
}

// ─── Existing helper functions ────────────────────────────────
export function getApiKey(provider: AIProvider): string {
  const settings = getSettings();
  return settings.providers[provider]?.apiKey || "";
}

export function setApiKey(provider: AIProvider, key: string): void {
  const settings = getSettings();
  settings.providers[provider].apiKey = key;
  updateSettings({ providers: settings.providers });
}

export function getActiveProvider(): { provider: AIProvider; model: string; apiKey: string } {
  const settings = getSettings();
  return {
    provider: settings.activeProvider,
    model: settings.activeModel,
    apiKey: settings.providers[settings.activeProvider]?.apiKey || "",
  };
}
