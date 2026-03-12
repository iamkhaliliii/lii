"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useSettings } from "@/hooks/useSettings";
import { AIProvider } from "@/types";
import { getModelsForProvider, providerNames } from "@/lib/ai/providers";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { translateDirect } from "@/lib/ai/client-direct";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<AIProvider>("openai");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

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
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold">Settings</h1>

        {/* Provider tabs */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted">
            AI Provider
          </h2>
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {providers.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setActiveTab(p);
                  setShowKey(false);
                  setTestResult(null);
                }}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === p
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {providerNames[p]}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <label className="mb-2 block text-sm font-medium">
            API Key ({providerNames[activeTab]})
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? "text" : "password"}
                value={currentConfig.apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={`Enter your ${providerNames[activeTab]} API key`}
                dir="ltr"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={!currentConfig.apiKey || testing}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
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
          {testResult === "success" && (
            <p className="mt-2 text-sm text-success">Connection successful!</p>
          )}
          {testResult === "error" && (
            <p className="mt-2 text-sm text-danger">Connection failed. Check your API key.</p>
          )}
        </div>

        {/* Default Model */}
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <label className="mb-2 block text-sm font-medium">
            Default Model
          </label>
          <select
            value={currentConfig.defaultModel}
            onChange={(e) => handleDefaultModelChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Set as active */}
        <div className="mb-8 rounded-xl border border-border bg-card p-4">
          <button
            onClick={() =>
              updateSettings({
                activeProvider: activeTab,
                activeModel: currentConfig.defaultModel,
              })
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              settings.activeProvider === activeTab
                ? "bg-success/10 text-success"
                : "bg-primary text-white hover:bg-primary-hover"
            }`}
          >
            {settings.activeProvider === activeTab
              ? "Currently Active"
              : `Set ${providerNames[activeTab]} as Active`}
          </button>
        </div>

        {/* Translation preferences */}
        <h2 className="mb-3 text-sm font-medium text-muted">
          Translation Preferences
        </h2>
        <div className="mb-8 space-y-3 rounded-xl border border-border bg-card p-4">
          <label className="flex items-center justify-between">
            <span className="text-sm">Auto-detect tone</span>
            <input
              type="checkbox"
              checked={settings.autoDetectTone}
              onChange={(e) =>
                updateSettings({ autoDetectTone: e.target.checked })
              }
              className="h-4 w-4 accent-primary"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Auto-suggest responses</span>
            <input
              type="checkbox"
              checked={settings.autoSuggestResponse}
              onChange={(e) =>
                updateSettings({ autoSuggestResponse: e.target.checked })
              }
              className="h-4 w-4 accent-primary"
            />
          </label>
        </div>
      </main>
    </div>
  );
}
