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
  Plus,
  Trash2,
  BookOpen,
  Pencil,
  Volume2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TranslationRule } from "@/types";
import { translateDirect } from "@/lib/ai/client-direct";
import { testSlackConnection } from "@/lib/slack";
import { useToast } from "@/components/Toast";

// ─── Translation Rules Section ───────────────────────────────

function RulesSection({
  rules,
  onUpdate,
}: {
  rules: TranslationRule[];
  onUpdate: (rules: TranslationRule[]) => void;
}) {
  const [newRule, setNewRule] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const addRule = () => {
    const text = newRule.trim();
    if (!text) return;
    const rule: TranslationRule = {
      id: Date.now().toString(),
      text,
      enabled: true,
      createdAt: Date.now(),
    };
    onUpdate([...rules, rule]);
    setNewRule("");
  };

  const removeRule = (id: string) => {
    onUpdate(rules.filter((r) => r.id !== id));
  };

  const toggleRule = (id: string) => {
    onUpdate(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const startEdit = (rule: TranslationRule) => {
    setEditingId(rule.id);
    setEditText(rule.text);
  };

  const saveEdit = () => {
    if (!editingId || !editText.trim()) return;
    onUpdate(rules.map((r) => (r.id === editingId ? { ...r, text: editText.trim() } : r)));
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <>
      <p className="mb-2 text-[11px] font-medium tracking-wide text-muted/60 uppercase">
        Translation Rules
      </p>
      <div className="mb-8 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
          <BookOpen size={16} className="text-muted" />
          <div className="flex-1">
            <p className="text-sm font-medium">Custom Rules</p>
            <p className="text-xs text-muted">
              Rules applied to every translation — names, terms, styles, etc.
            </p>
          </div>
          {rules.length > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted/60">
              {rules.filter((r) => r.enabled).length} active
            </span>
          )}
        </div>

        <div className="space-y-0 divide-y divide-border-subtle">
          {/* Existing rules */}
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                !rule.enabled ? "opacity-50" : ""
              }`}
            >
              <button
                onClick={() => toggleRule(rule.id)}
                className={`mt-0.5 toggle-switch ${rule.enabled ? "active" : ""}`}
                role="switch"
                aria-checked={rule.enabled}
                style={{ transform: "scale(0.75)", transformOrigin: "top left" }}
              />
              <div className="min-w-0 flex-1">
                {editingId === rule.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-background hover:bg-primary-hover"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-muted hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {rule.text}
                  </p>
                )}
              </div>
              {editingId !== rule.id && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => startEdit(rule)}
                    className="rounded-md p-1.5 text-muted/40 hover:bg-accent hover:text-foreground transition-colors"
                    title="Edit rule"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="rounded-md p-1.5 text-muted/40 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add new rule */}
          <div className="px-4 py-3">
            <div className="flex gap-2">
              <textarea
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addRule();
                  }
                }}
                placeholder="Add a rule, e.g.: When translating messages from Ami, keep 'salam ami aziz' as-is in the English translation..."
                rows={2}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder-muted/40 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10 resize-none"
              />
              <button
                onClick={addRule}
                disabled={!newRule.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-lg bg-primary text-background transition-colors hover:bg-primary-hover disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
            {rules.length === 0 && (
              <div className="mt-3 rounded-lg bg-accent/50 p-3">
                <p className="text-xs text-muted/60 leading-relaxed">
                  <strong>Examples:</strong>
                </p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted/50">
                  <li>• When the message is from Ami, keep &quot;salam ami aziz&quot; as-is in translation</li>
                  <li>• Always spell the name &quot;Hyck&quot; as &quot;Hayk&quot; in translations</li>
                  <li>• Use informal/friendly tone when translating messages from friends</li>
                  <li>• Keep all brand names (Google, Apple, etc.) in English</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

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

  const [showElevenKey, setShowElevenKey] = useState(false);

  // Slack state
  const [showSlackToken, setShowSlackToken] = useState(false);
  const [slackTesting, setSlackTesting] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState<{
    status: "success" | "error" | null;
    user?: string;
    team?: string;
    error?: string;
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
        setSlackTestResult({ status: "error", error: result.error });
        toast.error(result.error || "Slack connection failed");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setSlackTestResult({ status: "error", error: msg });
      toast.error(msg);
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
      <main className="flex-1 overflow-y-auto chat-scroll page-scroll">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6">
        <h1 className="mb-1 text-lg font-bold md:text-lg">Settings</h1>
        <p className="mb-5 text-[13px] text-muted md:mb-6 md:text-sm">
          Configure providers and preferences
        </p>

        {/* Provider tabs */}
        <p className="mb-2 text-xs font-medium tracking-wide text-muted/60 uppercase md:text-[11px]">
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
                className={`relative px-3 py-2.5 text-[13px] font-medium transition-colors md:py-2 md:text-sm ${
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
          <label className="text-[13px] font-medium md:text-sm">
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
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 pr-10 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10 md:rounded-lg md:py-2 md:text-sm"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted hover:text-foreground"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={!currentConfig.apiKey || testing}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors disabled:opacity-40 md:rounded-lg md:px-3.5 md:py-2 md:text-sm ${
                testResult === "success"
                  ? "bg-success-light text-success"
                  : testResult === "error"
                    ? "bg-danger-light text-danger"
                    : "bg-primary text-background hover:bg-primary-hover"
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
        <div className="mb-4 space-y-2">
          <label className="text-[13px] font-medium md:text-sm">Default Model</label>
          <select
            value={currentConfig.defaultModel}
            onChange={(e) => handleDefaultModelChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10 md:rounded-lg md:py-2 md:text-sm"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Set active */}
        <div className="mb-8 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 md:rounded-lg md:py-3">
          <div>
            <p className="text-[13px] font-medium md:text-sm">Active Provider</p>
            <p className="text-xs text-muted">
              {settings.activeProvider === activeTab
                ? "Currently active"
                : `Switch to ${providerNames[activeTab]}`}
            </p>
          </div>
          <button
            onClick={handleSetActive}
            disabled={settings.activeProvider === activeTab}
            className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-colors md:rounded-lg md:px-3 md:py-1.5 md:text-sm ${
              settings.activeProvider === activeTab
                ? "bg-success-light text-success"
                : "bg-primary text-background hover:bg-primary-hover"
            }`}
          >
            {settings.activeProvider === activeTab ? "✓ Active" : "Set Active"}
          </button>
        </div>

        {/* Appearance */}
        <p className="mb-2 text-xs font-medium tracking-wide text-muted/60 uppercase md:text-[11px]">
          Appearance
        </p>
        <div className="mb-8 rounded-xl border border-border bg-card">
          <div className="px-4 py-4">
            <p className="mb-3 text-[13px] font-medium md:text-sm">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "light" as const, label: "Light", icon: Sun },
                { id: "dark" as const, label: "Dark", icon: Moon },
                { id: "system" as const, label: "System", icon: Monitor },
              ]).map(({ id, label, icon: Icon }) => {
                const active = (settings.theme || "system") === id;
                return (
                  <button
                    key={id}
                    onClick={() => updateSettings({ theme: id })}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-medium transition-all press",
                      active
                        ? "border-primary bg-primary-muted text-primary"
                        : "border-border-subtle bg-accent/40 text-muted hover:border-border hover:text-foreground"
                    )}
                  >
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.5} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <p className="mb-2 text-xs font-medium tracking-wide text-muted/60 uppercase md:text-[11px]">
          Preferences
        </p>
        <div className="mb-8 divide-y divide-border-subtle rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 px-4 py-4 md:py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium md:text-sm">Auto-detect tone</p>
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
          <div className="flex items-center justify-between gap-3 px-4 py-4 md:py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium md:text-sm">Auto-suggest replies</p>
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
        <p className="mb-2 text-xs font-medium tracking-wide text-muted/60 uppercase md:text-[11px]">
          Integrations
        </p>

        {/* ElevenLabs — selection TTS */}
        <div className="mb-6 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
            <Volume2 size={16} className="text-muted" />
            <div className="flex-1">
              <p className="text-sm font-medium">ElevenLabs</p>
              <p className="text-xs text-muted">
                Optional API key for high-quality English TTS when you select text (American / British
                voices in the popover).
              </p>
            </div>
          </div>
          <div className="px-4 py-3">
            <label className="mb-1 block text-xs font-medium text-muted">API key</label>
            <div className="relative">
              <input
                type={showElevenKey ? "text" : "password"}
                value={settings.elevenLabsApiKey || ""}
                onChange={(e) => updateSettings({ elevenLabsApiKey: e.target.value })}
                placeholder="xi-api-key or sk_… from ElevenLabs"
                dir="ltr"
                autoComplete="off"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm font-mono focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={() => setShowElevenKey(!showElevenKey)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showElevenKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted/80">
              Key is stored on this device only. Never commit it to git. For web (non-Tauri), audio is
              proxied through this app&apos;s server; use HTTPS in production.
            </p>
          </div>
        </div>

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
                        : "bg-primary text-background hover:bg-primary-hover"
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
                Failed to connect{slackTestResult.error ? `: ${slackTestResult.error}` : ". Check your token and try again."}
              </p>
            )}
          </div>
        </div>

        {/* Translation Rules */}
        <RulesSection
          rules={settings.rules || []}
          onUpdate={(rules) => updateSettings({ rules })}
        />

        {/* Account */}
        {user && (
          <>
            <p className="mb-2 text-xs font-medium tracking-wide text-muted/60 uppercase md:text-[11px]">
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
