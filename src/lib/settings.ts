import { AIProvider, AppSettings } from "@/types";

const SETTINGS_KEY = "lii-settings";

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
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    return defaultSettings;
  }
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...partial };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("lii-settings-changed"));
  return updated;
}

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
