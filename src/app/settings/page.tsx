"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { AIProvider } from "@/types";
import { getModelsForProvider, providerNames } from "@/lib/ai/providers";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  LogOut,
  Hash,
} from "lucide-react";
import { translateDirect } from "@/lib/ai/client-direct";
import { testSlackConnection } from "@/lib/slack";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AIProvider>("openai");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null
  );
  const toast = useToast();

  // Slack state
  const [showSlackToken, setShowSlackToken] = useState(false);
  const [slackTesting, setSlackTesting] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState<{
    status: "success" | "error" | null;
    user?: string;
    team?: string;
  }>({ status: null });

  const slackToken = settings.slack?.token || "";

  const handleSlackTokenChange = (token: string) => {
    updateSettings({ slack: { token, connected: false } });
    setSlackTestResult({ status: null });
  };

  const handleSlackTest = async () => {
    setSlackTesting(true);
    setSlackTestResult({ status: null });
    try {
      const result = await testSlackConnection(slackToken);
      if (result.ok) {
        updateSettings({ slack: { token: slackToken, connected: true } });
        setSlackTestResult({ status: "success", user: result.user, team: result.team });
        toast.success(`Connected as ${result.user}`);
      } else {
        updateSettings({ slack: { token: slackToken, connected: false } });
        setSlackTestResult({ status: "error" });
        toast.error("Slack connection failed");
      }
    } catch {
      setSlackTestResult({ status: "error" });
      toast.error("Slack connection failed");
    } finally {
      setSlackTesting(false);
    }
  };

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
    toast.success(`${providerNames[activeTab]} set as active`);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-1 text-lg font-bold">Settings</h1>
        <p className="mb-6 text-sm text-muted">
          Configure providers and preferences
        </p>

        {/* Provider tabs */}
        <p className="mb-2 text-[11px] font-medium tracking-wide text-muted/60 uppercase">
          AI Provider
        </p>
        <div className="mb-6 flex gap-0.5 border-b border-border">
          {providers.map((p) => {
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
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {providerNames[p]}
                {isConfigured && !isActive && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-success" />
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* API Key + Test */}
        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium">
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
                className="w-full rounded-lg border border-border bg-card px-3 py-2 pr-10 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={!currentConfig.apiKey || testing}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                testResult === "success"
                  ? "bg-success-light text-success"
                  : testResult === "error"
                    ? "bg-danger-light text-danger"
                    : "bg-primary text-white hover:bg-primary-hover"
              }`}
            >
              {testing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : testResult === "success" ? (
                <CheckCircle size={13} />
              ) : testResult === "error" ? (
                <XCircle size={13} />
              ) : null}
              Test
            </button>
          </div>
        </div>

        {/* Default Model */}
        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium">Default Model</label>
          <select
            value={currentConfig.defaultModel}
            onChange={(e) => handleDefaultModelChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Set active */}
        <div className="mb-8 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <div>
            <p className="text-sm font-medium">Active Provider</p>
            <p className="text-xs text-muted">
              {settings.activeProvider === activeTab
                ? "Currently active"
                : `Switch to ${providerNames[activeTab]}`}
            </p>
          </div>
          <button
            onClick={handleSetActive}
            disabled={settings.activeProvider === activeTab}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              settings.activeProvider === activeTab
                ? "bg-success-light text-success"
                : "bg-primary text-white hover:bg-primary-hover"
            }`}
          >
            {settings.activeProvider === activeTab ? "✓ Active" : "Set Active"}
          </button>
        </div>

        {/* Preferences */}
        <p className="mb-2 text-[11px] font-medium tracking-wide text-muted/60 uppercase">
          Preferences
        </p>
        <div className="mb-8 divide-y divide-border-subtle rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3.5">
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
              className={`toggle-switch ${settings.autoDetectTone ? "active" : ""}`}
              role="switch"
              aria-checked={settings.autoDetectTone}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-sm font-medium">Auto-suggest replies</p>
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
              className={`toggle-switch ${settings.autoSuggestResponse ? "active" : ""}`}
              role="switch"
              aria-checked={settings.autoSuggestResponse}
            />
          </div>
        </div>

        {/* Integrations — Slack */}
        <p className="mb-2 text-[11px] font-medium tracking-wide text-muted/60 uppercase">
          Integrations
        </p>
        <div className="mb-8 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
            <Hash size={16} className="text-muted" />
            <div className="flex-1">
              <p className="text-sm font-medium">Slack</p>
              <p className="text-xs text-muted">
                Browse DMs & channels, translate, and reply
              </p>
            </div>
            {settings.slack?.connected && (
              <span className="flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-medium text-success">
                <CheckCircle size={10} />
                Connected
              </span>
            )}
          </div>
          <div className="space-y-3 px-4 py-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                User OAuth Token
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showSlackToken ? "text" : "password"}
                    value={slackToken}
                    onChange={(e) => handleSlackTokenChange(e.target.value)}
                    placeholder="xoxp-..."
                    dir="ltr"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm font-mono focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
                  />
                  <button
                    onClick={() => setShowSlackToken(!showSlackToken)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {showSlackToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  onClick={handleSlackTest}
                  disabled={!slackToken || slackTesting}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                    slackTestResult.status === "success"
                      ? "bg-success-light text-success"
                      : slackTestResult.status === "error"
                        ? "bg-danger-light text-danger"
                        : "bg-primary text-white hover:bg-primary-hover"
                  }`}
                >
                  {slackTesting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : slackTestResult.status === "success" ? (
                    <CheckCircle size={13} />
                  ) : slackTestResult.status === "error" ? (
                    <XCircle size={13} />
                  ) : null}
                  Test
                </button>
              </div>
            </div>
            {slackTestResult.status === "success" && slackTestResult.user && (
              <p className="text-xs text-success">
                Connected as <strong>{slackTestResult.user}</strong>
                {slackTestResult.team && ` · ${slackTestResult.team}`}
              </p>
            )}
            {slackTestResult.status === "error" && (
              <p className="text-xs text-danger">
                Failed to connect. Check your token and try again.
              </p>
            )}
          </div>
        </div>

        {/* Account */}
        {user && (
          <>
            <p className="mb-2 text-[11px] font-medium tracking-wide text-muted/60 uppercase">
              Account
            </p>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-accent hover:text-danger"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}
