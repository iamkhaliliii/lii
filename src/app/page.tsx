"use client";
import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import ProviderSelector from "@/components/ProviderSelector";
import TranslateInput from "@/components/TranslateInput";
import TranslationResult from "@/components/TranslationResult";
import ToneIndicator from "@/components/ToneIndicator";
import ResponseSuggestions from "@/components/ResponseSuggestions";
import { useSettings } from "@/hooks/useSettings";
import { useHistory } from "@/hooks/useHistory";
import { ToneAnalysis } from "@/types";
import { generateId } from "@/lib/utils";
import { getActiveProvider, updateSettings } from "@/lib/settings";
import { translateDirect, translateImageDirect } from "@/lib/ai/client-direct";

export default function Home() {
  const { settings } = useSettings();
  const { save } = useHistory();
  const [translation, setTranslation] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [tone, setTone] = useState<ToneAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTranslate = useCallback(
    async (text: string) => {
      setLoading(true);
      setError("");
      setTranslation("");
      setTone(null);
      setSuggestions([]);
      setOriginalText(text);

      const { provider, model, apiKey } = getActiveProvider();

      if (!apiKey) {
        setError("Please set your API key in Settings first.");
        setLoading(false);
        return;
      }

      try {
        const data = await translateDirect({
          provider,
          apiKey,
          modelId: model,
          text,
          detectTone: settings.autoDetectTone,
        });

        setTranslation(data.translation || "");
        if (data.tone) setTone(data.tone);
        if (data.suggestedResponses) setSuggestions(data.suggestedResponses);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Translation failed");
      } finally {
        setLoading(false);
      }
    },
    [settings.autoDetectTone]
  );

  const handleImageUpload = useCallback(
    async (base64: string) => {
      setLoading(true);
      setError("");
      setTranslation("");
      setTone(null);
      setSuggestions([]);
      setOriginalText("[Image]");

      const { provider, model, apiKey } = getActiveProvider();

      if (!apiKey) {
        setError("Please set your API key in Settings first.");
        setLoading(false);
        return;
      }

      try {
        const data = await translateImageDirect({
          provider,
          apiKey,
          modelId: model,
          imageBase64: base64,
          detectTone: settings.autoDetectTone,
        });

        if (data.extractedText) setOriginalText(data.extractedText);
        setTranslation(data.translation || "");
        if (data.tone) setTone(data.tone);
        if (data.suggestedResponses) setSuggestions(data.suggestedResponses);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Image translation failed");
      } finally {
        setLoading(false);
      }
    },
    [settings.autoDetectTone]
  );

  const handleSave = async () => {
    if (!translation) return;
    const { provider, model } = getActiveProvider();
    await save({
      id: generateId(),
      originalText,
      translatedText: translation,
      tone: tone || undefined,
      suggestedResponses: suggestions.length ? suggestions : undefined,
      provider,
      model,
      timestamp: Date.now(),
      source: originalText === "[Image]" ? "image" : "text",
      starred: false,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {/* Header controls */}
        <div className="flex items-center justify-between">
          <ProviderSelector />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.autoDetectTone}
              onChange={(e) =>
                updateSettings({ autoDetectTone: e.target.checked })
              }
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-muted">Detect Tone</span>
          </label>
        </div>

        {/* Input */}
        <TranslateInput
          onTranslate={handleTranslate}
          onImageUpload={handleImageUpload}
          loading={loading}
        />

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-danger/20 bg-red-50 p-3 text-sm text-danger dark:bg-red-950">
            {error}
          </div>
        )}

        {/* Translation result */}
        <TranslationResult
          translation={translation}
          onSave={translation ? handleSave : undefined}
        />

        {/* Tone analysis */}
        {tone && <ToneIndicator tone={tone} />}

        {/* Response suggestions */}
        {suggestions.length > 0 && (
          <ResponseSuggestions suggestions={suggestions} />
        )}
      </main>
    </div>
  );
}
