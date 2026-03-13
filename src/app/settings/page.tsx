"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useSettings } from "@/hooks/useSettings";
import { AIProvider } from "@/types";
import { getModelsForProvider, providerNames } from "@/lib/ai/providers";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  Brain,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { translateDirect } from "@/lib/ai/client-direct";
import { useToast } from "@/components/Toast";

const providerIcons: Record<AIProvider, typeof Zap> = {
  openai: Zap,
  anthropic: Brain,
  google: Sparkles,
};

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<AIProvider>("openai");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null
  );
  const toast = useToast();

  const providers: AIProvider[] = ["openai", "anthropic", "google"];
  const currentConfig = settings.providers[activeTab];
  const models = getModelsForProvider(activeTab);

  const handleApiKeyChange = (key: string) => {
    const updated = { ...settings.providers };
    updated[activeTab] = { ...updated[activeTab], apiKey: key };
    updateSettings({ providers: updated });
    setTestResult(null);
  };

  const handleDefaultModelChange = (modelId: string) => {
    const updated = { ...settings.providers };
    updated[activeTab] = { ...updated[activeTab], defaultModel: modelId };
    updateSettings({ providers: updated });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      await translateDirect({
        provider: activeTab,
        apiKey: currentConfig.apiKey,
        modelId: currentConfig.defaultModel,
        text: "Hello",
        detectTone: false,
      });
      setTestResult("success");
      toast.success("Connection successful!");
    } catch {
      setTestResult("error");
      toast.error("Connection failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSetActive = () => {
    updateSettings({
      activeProvider: activeTab,
      activeModel: currentConfig.defaultModel,
    });
    toast.success(`${providerNames[activeTab]} set as active provider`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-1 text-xl font-bold">Settings</h1>
        <p className="mb-6 text-sm text-muted">
          Configure AI providers and translation preferences
        </p>

        {/* Provider tabs */}
        <div className="mb-6">
          <h2 className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">
            AI Provider
          </h2>
          <div
            className="flex gap-1 rounded-2xl border border-border bg-card p-1.5"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            {providers.map((p) => {
              const ProviderIcon = providerIcons[p];
              const isActive = activeTab === p;
              const isConfigured = settings.activeProvider === p;
              return (
                <button
                  key={p}
                  onClick={() => {
                    setActiveTab(p);
                    setShowKey(false);
                    setTestResult(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "gradient-btn text-white"
                      : "text-muted hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <ProviderIcon size={14} />
                  {providerNames[p]}
                  {isConfigured && !isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* API Key */}
        <div
          className="mb-4 rounded-2xl border border-border bg-card p-5"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <label className="mb-2.5 block text-sm font-medium">
            API Key
            <span className="ml-1.5 text-xs font-normal text-muted">
              {providerNames[activeTab]}
            </span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? "text" : "password"}
                value={currentConfig.apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={`Enter your ${providerNames[activeTab]} API key`}
                dir="ltr"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm transition-colors focus:border-primary/60 focus:outline-none"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={!currentConfig.apiKey || testing}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40 ${
                testResult === "success"
                  ? "bg-success/10 text-success"
                  : testResult === "error"
                    ? "bg-danger/10 text-danger"
                    : "gradient-btn text-white"
              }`}
            >
              {testing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : testResult === "success" ? (
                <CheckCircle size={14} />
              ) : testResult === "error" ? (
                <XCircle size={14} />
              ) : null}
              Test
            </button>
          </div>
        </div>

        {/* Default Model */}
        <div
          className="mb-4 rounded-2xl border border-border bg-card p-5"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <label className="mb-2.5 block text-sm font-medium">
            Default Model
          </label>
          <select
            value={currentConfig.defaultModel}
            onChange={(e) => handleDefaultModelChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm transition-colors focus:border-primary/60 focus:outline-none"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Set as active */}
        <div
          className="mb-8 rounded-2xl border border-border bg-card p-5"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Active Provider</p>
              <p className="text-xs text-muted">
                {settings.activeProvider === activeTab
                  ? `${providerNames[activeTab]} is currently active`
                  : `Switch to ${providerNames[activeTab]}`}
              </p>
            </div>
            <button
              onClick={handleSetActive}
              disabled={settings.activeProvider === activeTab}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                settings.activeProvider === activeTab
                  ? "bg-success/10 text-success"
                  : "gradient-btn text-white"
              }`}
            >
              {settings.activeProvider === activeTab
                ? "✓ Active"
                : "Set Active"}
            </button>
          </div>
        </div>

        {/* Translation preferences */}
        <h2 className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">
          Translation Preferences
        </h2>
        <div
          className="mb-8 space-y-1 overflow-hidden rounded-2xl border border-border bg-card"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <label className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-accent/50">
            <div>
              <p className="text-sm font-medium">Auto-detect tone</p>
              <p className="text-xs text-muted">
                Analyze formality, sentiment, and context
              </p>
            </div>
            <button
              onClick={() =>
                updateSettings({ autoDetectTone: !settings.autoDetectTone })
              }
              className="text-muted"
            >
              {settings.autoDetectTone ? (
                <ToggleRight size={28} className="text-primary" />
              ) : (
                <ToggleLeft size={28} />
              )}
            </button>
          </label>
          <div className="mx-5 border-t border-border/50" />
          <label className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-accent/50">
            <div>
              <p className="text-sm font-medium">Auto-suggest responses</p>
              <p className="text-xs text-muted">
                Generate bilingual reply suggestions
              </p>
            </div>
            <button
              onClick={() =>
                updateSettings({
                  autoSuggestResponse: !settings.autoSuggestResponse,
                })
              }
              className="text-muted"
            >
              {settings.autoSuggestResponse ? (
                <ToggleRight size={28} className="text-primary" />
              ) : (
                <ToggleLeft size={28} />
              )}
            </button>
          </label>
        </div>
      </main>
    </div>
  );
}
