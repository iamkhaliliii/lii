"use client";
import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import ProviderSelector from "@/components/ProviderSelector";
import ContactSelector from "@/components/ContactSelector";
import TranslateInput from "@/components/TranslateInput";
import TranslationResult from "@/components/TranslationResult";
import ToneIndicator from "@/components/ToneIndicator";
import ResponseSuggestions from "@/components/ResponseSuggestions";
import EmptyState from "@/components/EmptyState";
import TranslationSkeleton from "@/components/TranslationSkeleton";
import { useSettings } from "@/hooks/useSettings";
import { useHistory } from "@/hooks/useHistory";
import { useContacts } from "@/hooks/useContacts";
import { ToneAnalysis, BilingualSuggestion, PersonContext } from "@/types";
import { generateId } from "@/lib/utils";
import { getActiveProvider, updateSettings } from "@/lib/settings";
import { translateDirect, translateImageDirect } from "@/lib/ai/client-direct";
import { providerNames } from "@/lib/ai/providers";
import { saveContactMessage } from "@/lib/storage";

export default function Home() {
  const { settings } = useSettings();
  const { save } = useHistory();
  const {
    contacts,
    selectedContactId,
    select: selectContact,
    create: createContact,
    getPersonContext,
  } = useContacts();

  const [translation, setTranslation] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [tone, setTone] = useState<ToneAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<BilingualSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasTranslated, setHasTranslated] = useState(false);

  // Build person context if a contact is selected
  const buildContext = useCallback(async (): Promise<
    PersonContext | undefined
  > => {
    if (!selectedContactId) return undefined;
    const ctx = await getPersonContext(selectedContactId);
    return ctx || undefined;
  }, [selectedContactId, getPersonContext]);

  // Save contact message after translation
  const saveToContactHistory = useCallback(
    async (original: string, translated: string, toneData?: ToneAnalysis) => {
      if (!selectedContactId) return;
      await saveContactMessage({
        id: generateId(),
        contactId: selectedContactId,
        direction: "from_them",
        originalText: original,
        translatedText: translated,
        tone: toneData,
        timestamp: Date.now(),
      });
    },
    [selectedContactId]
  );

  const handleTranslate = useCallback(
    async (text: string) => {
      setLoading(true);
      setError("");
      setTranslation("");
      setTone(null);
      setSuggestions([]);
      setOriginalText(text);
      setHasTranslated(true);

      const { provider, model, apiKey } = getActiveProvider();

      if (!apiKey) {
        setError("Please set your API key in Settings first.");
        setLoading(false);
        return;
      }

      try {
        const personContext = await buildContext();
        const data = await translateDirect({
          provider,
          apiKey,
          modelId: model,
          text,
          detectTone: settings.autoDetectTone,
          personContext,
        });

        setTranslation(data.translation || "");
        if (data.tone) setTone(data.tone);
        if (data.suggestedResponses) setSuggestions(data.suggestedResponses);

        await saveToContactHistory(text, data.translation || "", data.tone);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Translation failed");
      } finally {
        setLoading(false);
      }
    },
    [settings.autoDetectTone, buildContext, saveToContactHistory]
  );

  const handleImageUpload = useCallback(
    async (base64List: string[]) => {
      setLoading(true);
      setError("");
      setTranslation("");
      setTone(null);
      setSuggestions([]);
      const placeholder = `[${base64List.length} Image${base64List.length > 1 ? "s" : ""}]`;
      setOriginalText(placeholder);
      setHasTranslated(true);

      const { provider, model, apiKey } = getActiveProvider();

      if (!apiKey) {
        setError("Please set your API key in Settings first.");
        setLoading(false);
        return;
      }

      try {
        const personContext = await buildContext();
        const data = await translateImageDirect({
          provider,
          apiKey,
          modelId: model,
          imageBase64: base64List,
          detectTone: settings.autoDetectTone,
          personContext,
        });

        const extractedText = data.extractedText || placeholder;
        if (data.extractedText) setOriginalText(data.extractedText);
        setTranslation(data.translation || "");
        if (data.tone) setTone(data.tone);
        if (data.suggestedResponses) setSuggestions(data.suggestedResponses);

        await saveToContactHistory(
          extractedText,
          data.translation || "",
          data.tone
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Image translation failed"
        );
      } finally {
        setLoading(false);
      }
    },
    [settings.autoDetectTone, buildContext, saveToContactHistory]
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
      source:
        originalText.startsWith("[") &&
        originalText.endsWith("]") &&
        originalText.includes("Image")
          ? "image"
          : "text",
      starred: false,
      contactId: selectedContactId || undefined,
    });
  };

  const { provider } = getActiveProvider();
  const activeProviderName = providerNames[provider];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-8">
        {/* Input Zone */}
        <section className="sticky top-0 z-10 -mx-4 bg-background/80 px-4 pt-6 pb-4 backdrop-blur-sm">
          {/* Header controls */}
          <div className="mb-3 flex items-center justify-between">
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

          {/* Contact selector */}
          <ContactSelector
            contacts={contacts}
            selectedContactId={selectedContactId}
            onSelect={selectContact}
            onCreate={createContact}
          />

          {/* Input */}
          <TranslateInput
            onTranslate={handleTranslate}
            onImageUpload={handleImageUpload}
            loading={loading}
          />
        </section>

        {/* Results Zone */}
        <section className="space-y-4 pt-2">
          {/* Error */}
          {error && (
            <div className="animate-slide-up rounded-xl border border-danger/20 bg-red-50 p-3 text-sm text-danger dark:bg-red-950">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && <TranslationSkeleton />}

          {/* Translation result */}
          {!loading && translation && (
            <>
              <TranslationResult
                translation={translation}
                onSave={handleSave}
                providerName={activeProviderName}
              />

              {tone && <ToneIndicator tone={tone} />}

              {suggestions.length > 0 && (
                <ResponseSuggestions suggestions={suggestions} />
              )}
            </>
          )}

          {/* Empty state */}
          {!loading && !translation && !error && !hasTranslated && (
            <EmptyState />
          )}
        </section>
      </main>
    </div>
  );
}
