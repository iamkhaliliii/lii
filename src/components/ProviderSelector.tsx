"use client";
import { AIProvider } from "@/types";
import { getModelsForProvider, providerNames } from "@/lib/ai/providers";
import { useSettings } from "@/hooks/useSettings";
import { ChevronDown } from "lucide-react";

export default function ProviderSelector() {
  const { settings, updateSettings } = useSettings();

  const handleProviderChange = (provider: AIProvider) => {
    const models = getModelsForProvider(provider);
    const defaultModel = settings.providers[provider].defaultModel || models[0]?.id || "";
    updateSettings({ activeProvider: provider, activeModel: defaultModel });
  };

  const handleModelChange = (modelId: string) => {
    updateSettings({ activeModel: modelId });
  };

  const activeModels = getModelsForProvider(settings.activeProvider);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={settings.activeProvider}
          onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
          className="appearance-none rounded-lg border border-border bg-card py-1.5 pl-3 pr-8 text-sm font-medium focus:border-primary focus:outline-none"
        >
          {(["openai", "anthropic", "google"] as AIProvider[]).map((p) => (
            <option key={p} value={p}>
              {providerNames[p]}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted" />
      </div>
      <div className="relative">
        <select
          value={settings.activeModel}
          onChange={(e) => handleModelChange(e.target.value)}
          className="appearance-none rounded-lg border border-border bg-card py-1.5 pl-3 pr-8 text-sm focus:border-primary focus:outline-none"
        >
          {activeModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
