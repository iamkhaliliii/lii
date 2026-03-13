import { AIProvider, BilingualSuggestion, PersonContext } from "@/types";
import { getModelById } from "./providers";
import {
  buildTranslatePrompt,
  buildImageTranslatePrompt,
  buildPolishReplyPrompt,
} from "../prompts/translate";

interface TranslateParams {
  provider: AIProvider;
  apiKey: string;
  modelId: string;
  text: string;
  detectTone: boolean;
  personContext?: PersonContext;
}

interface TranslateImageParams {
  provider: AIProvider;
  apiKey: string;
  modelId: string;
  imageBase64: string | string[];
  detectTone: boolean;
  personContext?: PersonContext;
}

// Normalize suggestions to BilingualSuggestion[] for backward compat
function normalizeSuggestions(
  raw: unknown
): BilingualSuggestion[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((item) => {
    if (typeof item === "string") {
      return { english: "", farsi: item };
    }
    if (item && typeof item === "object") {
      return {
        english: (item as Record<string, string>).english || "",
        farsi: (item as Record<string, string>).farsi || "",
      };
    }
    return { english: "", farsi: String(item) };
  });
}

function parseAIResponse(raw: string) {
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.suggestedResponses) {
      parsed.suggestedResponses = normalizeSuggestions(
        parsed.suggestedResponses
      );
    }

    // Normalize needsResponse to boolean
    if (parsed.needsResponse !== undefined) {
      parsed.needsResponse = Boolean(parsed.needsResponse);
    }

    // Normalize detectedSender to string | null
    if (parsed.tone) {
      if (!parsed.tone.detectedSender || parsed.tone.detectedSender === "") {
        parsed.tone.detectedSender = null;
      }
    }

    return parsed;
  } catch {
    return { translation: raw.trim() };
  }
}

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{
    role: string;
    content: string | Array<Record<string, unknown>>;
  }>
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.3,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0]?.message?.content || "";
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{
    role: string;
    content: string | Array<Record<string, unknown>>;
  }>
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || "";
}

async function callGoogle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  text: string
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text }] }],
        generationConfig: { temperature: 0.3 },
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function translateDirect(params: TranslateParams) {
  const model = getModelById(params.modelId);
  const actualModelId = model?.modelId || params.modelId;
  const systemPrompt = buildTranslatePrompt(
    params.detectTone,
    params.personContext
  );

  let raw: string;

  switch (params.provider) {
    case "openai":
      raw = await callOpenAI(params.apiKey, actualModelId, systemPrompt, [
        { role: "user", content: params.text },
      ]);
      break;
    case "anthropic":
      raw = await callAnthropic(params.apiKey, actualModelId, systemPrompt, [
        { role: "user", content: params.text },
      ]);
      break;
    case "google":
      raw = await callGoogle(
        params.apiKey,
        actualModelId,
        systemPrompt,
        params.text
      );
      break;
    default:
      throw new Error(`Unsupported provider: ${params.provider}`);
  }

  return parseAIResponse(raw);
}

export async function translateImageDirect(params: TranslateImageParams) {
  const model = getModelById(params.modelId);
  const actualModelId = model?.modelId || params.modelId;
  const systemPrompt = buildImageTranslatePrompt(
    params.detectTone,
    params.personContext
  );

  const images = Array.isArray(params.imageBase64)
    ? params.imageBase64
    : [params.imageBase64];

  const parsed = images.map((img) => {
    const match = img.match(/^data:(.+?);base64,(.+)$/);
    if (!match) throw new Error("Invalid image format");
    return { mediaType: match[1], data: match[2], url: img };
  });

  let raw: string;

  switch (params.provider) {
    case "openai":
      raw = await callOpenAI(params.apiKey, actualModelId, systemPrompt, [
        {
          role: "user",
          content: parsed.map((p) => ({
            type: "image_url",
            image_url: { url: p.url },
          })),
        },
      ]);
      break;
    case "anthropic":
      raw = await callAnthropic(params.apiKey, actualModelId, systemPrompt, [
        {
          role: "user",
          content: parsed.map((p) => ({
            type: "image",
            source: {
              type: "base64",
              media_type: p.mediaType,
              data: p.data,
            },
          })),
        },
      ]);
      break;
    case "google": {
      const parts = [
        ...parsed.map((p) => ({
          inline_data: { mime_type: p.mediaType, data: p.data },
        })),
        { text: "Translate these images" },
      ];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${actualModelId}:generateContent?key=${params.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts }],
            generationConfig: { temperature: 0.3 },
          }),
        }
      );
      const respData = await res.json();
      if (respData.error) throw new Error(respData.error.message);
      raw = respData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      break;
    }
    default:
      throw new Error(`Unsupported provider: ${params.provider}`);
  }

  return parseAIResponse(raw);
}

// ─── Polish Reply ─────────────────────────────────────────

interface PolishReplyParams {
  provider: AIProvider;
  apiKey: string;
  modelId: string;
  draft: string;
  originalMessage: string;
}

export async function polishReplyDirect(
  params: PolishReplyParams
): Promise<{ polished: string; farsi: string }> {
  const model = getModelById(params.modelId);
  const actualModelId = model?.modelId || params.modelId;
  const systemPrompt = buildPolishReplyPrompt(params.originalMessage);

  let raw: string;

  switch (params.provider) {
    case "openai":
      raw = await callOpenAI(params.apiKey, actualModelId, systemPrompt, [
        { role: "user", content: params.draft },
      ]);
      break;
    case "anthropic":
      raw = await callAnthropic(params.apiKey, actualModelId, systemPrompt, [
        { role: "user", content: params.draft },
      ]);
      break;
    case "google":
      raw = await callGoogle(
        params.apiKey,
        actualModelId,
        systemPrompt,
        params.draft
      );
      break;
    default:
      throw new Error(`Unsupported provider: ${params.provider}`);
  }

  const parsed = parseAIResponse(raw);
  return {
    polished: parsed.polished || params.draft,
    farsi: parsed.farsi || "",
  };
}
