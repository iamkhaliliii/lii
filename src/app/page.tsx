"use client";
import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import ProviderSelector from "@/components/ProviderSelector";
import ContactSelector from "@/components/ContactSelector";
import ContactDetectionBanner from "@/components/ContactDetectionBanner";
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
import { getActiveProvider } from "@/lib/settings";
import { translateDirect, translateImageDirect } from "@/lib/ai/client-direct";
import { providerNames } from "@/lib/ai/providers";
import { saveContactMessage } from "@/lib/storage";
import {
  detectContactFromText,
  type ParsedMessage,
  type DetectionResult,
} from "@/lib/contact-detection";

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

  // Detection state
  const [detectionResult, setDetectionResult] = useState<{
    parsed: ParsedMessage;
    match: DetectionResult;
  } | null>(null);
  const [detectionConfirmed, setDetectionConfirmed] = useState(false);

  // Build person context if a contact is selected
  const buildContext = useCallback(
    async (): Promise<PersonContext | undefined> => {
      if (!selectedContactId) return undefined;
      const ctx = await getPersonContext(selectedContactId);
      return ctx || undefined;
    },
    [selectedContactId, getPersonContext]
  );

  // Save contact message after translation
  const saveToContactHistory = useCallback(
    async (
      original: string,
      translated: string,
      toneData?: ToneAnalysis
    ) => {
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

  // Smart contact detection on text change
  const handleTextChange = useCallback(
    (text: string) => {
      // Don't run if contact is manually selected
      if (selectedContactId) {
        setDetectionResult(null);
        return;
      }
      const result = detectContactFromText(text, contacts);
      if (result.match.type === "none") {
        setDetectionResult(null);
      } else {
        setDetectionResult(result);
        setDetectionConfirmed(false);
        // Exact match: auto-select
        if (result.match.type === "exact") {
          selectContact(result.match.contact.id);
          setDetectionConfirmed(true);
        }
      }
    },
    [contacts, selectedContactId, selectContact]
  );

  // Detection banner handlers
  const handleConfirmExact = useCallback(() => {
    setDetectionConfirmed(true);
  }, []);

  const handleConfirmFuzzy = useCallback(() => {
    if (detectionResult?.match.type === "fuzzy") {
      selectContact(detectionResult.match.contact.id);
      setDetectionConfirmed(true);
    }
  }, [detectionResult, selectContact]);

  const handleCreateNewFromDetection = useCallback(async () => {
    if (detectionResult?.parsed.detectedName) {
      const contact = await createContact(
        detectionResult.parsed.detectedName,
        "colleague"
      );
      selectContact(contact.id);
      setDetectionConfirmed(true);
      setDetectionResult(null);
    }
  }, [detectionResult, createContact, selectContact]);

  const handleDismissDetection = useCallback(() => {
    setDetectionResult(null);
  }, []);

  const handleTranslate = useCallback(
    async (text: string) => {
      // Use cleaned text if contact was detected
      let actualText = text;
      if (detectionResult?.parsed.cleanedText && detectionConfirmed) {
        actualText = detectionResult.parsed.cleanedText;
      } else if (!selectedContactId && !detectionResult) {
        // Try detection at translate time
        const result = detectContactFromText(text, contacts);
        if (result.match.type === "exact") {
          selectContact(result.match.contact.id);
          actualText = result.parsed.cleanedText;
        } else if (
          result.match.type === "fuzzy" ||
          result.match.type === "new"
        ) {
          setDetectionResult(result);
          return; // Pause — wait for user to confirm
        }
      }

      setLoading(true);
      setError("");
      setTranslation("");
      setTone(null);
      setSuggestions([]);
      setOriginalText(actualText);
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
          text: actualText,
          detectTone: settings.autoDetectTone,
          personContext,
        });

        setTranslation(data.translation || "");
        if (data.tone) setTone(data.tone);
        if (data.suggestedResponses) setSuggestions(data.suggestedResponses);

        await saveToContactHistory(
          actualText,
          data.translation || "",
          data.tone
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Translation failed");
      } finally {
        setLoading(false);
      }
    },
    [
      settings.autoDetectTone,
      buildContext,
      saveToContactHistory,
      detectionResult,
      detectionConfirmed,
      selectedContactId,
      contacts,
      selectContact,
    ]
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
  const showDetectionBanner =
    detectionResult &&
    detectionResult.match.type !== "none" &&
    !detectionConfirmed;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-8">
        {/* Input Zone */}
        <section className="glass sticky top-0 z-10 -mx-4 space-y-3 px-4 pt-5 pb-4">
          {/* Provider selector */}
          <ProviderSelector />

          {/* Contact selector */}
          <ContactSelector
            contacts={contacts}
            selectedContactId={selectedContactId}
            onSelect={selectContact}
            onCreate={createContact}
          />

          {/* Detection banner */}
          {showDetectionBanner && (
            <ContactDetectionBanner
              match={detectionResult.match}
              detectedName={detectionResult.parsed.detectedName!}
              onConfirmExact={handleConfirmExact}
              onConfirmFuzzy={handleConfirmFuzzy}
              onCreateNew={handleCreateNewFromDetection}
              onDismiss={handleDismissDetection}
            />
          )}

          {/* Input */}
          <TranslateInput
            onTranslate={handleTranslate}
            onImageUpload={handleImageUpload}
            onTextChange={handleTextChange}
            loading={loading}
          />
        </section>

        {/* Results Zone */}
        <section className="space-y-3 pt-4">
          {/* Error */}
          {error && (
            <div className="animate-slide-up rounded-xl bg-danger-light p-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && <TranslationSkeleton />}

          {/* Translation result */}
          {!loading && translation && (
            <>
              <TranslationResult
                translatedText={translation}
                onSave={handleSave}
                provider={activeProviderName}
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
