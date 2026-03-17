import { AIProvider, BilingualSuggestion, PersonContext, TranslationRule } from "@/types";
import { getModelById } from "./providers";
import {
  buildTranslatePrompt,
  buildImageTranslatePrompt,
  buildPolishReplyPrompt,
  buildTranscriptAnalysisPrompt,
  buildTranscriptChunkTranslatePrompt,
} from "../prompts/translate";

interface TranslateParams {
  provider: AIProvider;
  apiKey: string;
  modelId: string;
  text: string;
  detectTone: boolean;
  personContext?: PersonContext;
  rules?: TranslationRule[];
}

interface TranslateImageParams {
  provider: AIProvider;
  apiKey: string;
  modelId: string;
  imageBase64: string | string[];
  detectTone: boolean;
  personContext?: PersonContext;
  rules?: TranslationRule[];
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
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
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
    params.personContext,
    params.rules
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
    params.personContext,
    params.rules
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
  rules?: TranslationRule[];
}

export async function polishReplyDirect(
  params: PolishReplyParams
): Promise<{ polished: string; farsi: string }> {
  const model = getModelById(params.modelId);
  const actualModelId = model?.modelId || params.modelId;
  const systemPrompt = buildPolishReplyPrompt(params.originalMessage, params.rules);

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

// ─── Transcript Analysis (Chunked) ─────────────────────────

interface TranscriptParams {
  provider: AIProvider;
  apiKey: string;
  modelId: string;
  transcript: string;
  rules?: TranslationRule[];
  onProgress?: (step: string, current: number, total: number) => void;
}

async function callAnthropicLong(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>
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
      max_tokens: 8192,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || "";
}

async function callOpenAILong(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 16384,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.3,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0]?.message?.content || "";
}

async function callGoogleLong(
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
        generationConfig: { temperature: 0.3, maxOutputTokens: 16384 },
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Split transcript into chunks at natural boundaries (speaker turns, paragraphs)
function splitTranscriptIntoChunks(transcript: string, maxWordsPerChunk = 1500): string[] {
  const lines = transcript.split("\n");
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const line of lines) {
    const lineWords = line.trim().split(/\s+/).filter(Boolean).length;

    // If adding this line exceeds limit and we have content, start new chunk
    if (currentWordCount + lineWords > maxWordsPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n"));
      currentChunk = [];
      currentWordCount = 0;
    }

    currentChunk.push(line);
    currentWordCount += lineWords;
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n"));
  }

  return chunks;
}

function parseJSON(raw: string) {
  let jsonStr = raw.trim();
  jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "");

  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to salvage truncated JSON
    const start = raw.indexOf("{");
    if (start !== -1) {
      let partial = raw.slice(start);
      let depth = 0;
      let inStr = false;
      let esc = false;
      for (let i = 0; i < partial.length; i++) {
        const c = partial[i];
        if (esc) { esc = false; continue; }
        if (c === "\\") { esc = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === "{" || c === "[") depth++;
        if (c === "}" || c === "]") depth--;
      }
      while (depth > 0) { partial += "}"; depth--; }
      try { return JSON.parse(partial); } catch { /* noop */ }
    }
    return null;
  }
}

async function callLong(
  provider: AIProvider,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: string
): Promise<string> {
  try {
    switch (provider) {
      case "openai":
        return await callOpenAILong(apiKey, model, systemPrompt, [{ role: "user", content: userContent }]);
      case "anthropic":
        return await callAnthropicLong(apiKey, model, systemPrompt, [{ role: "user", content: userContent }]);
      case "google":
        return await callGoogleLong(apiKey, model, systemPrompt, userContent);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (err) {
    console.error(`[callLong] ${provider}/${model} failed:`, err);
    throw err;
  }
}

export async function analyzeTranscriptDirect(params: TranscriptParams) {
  const model = getModelById(params.modelId);
  const actualModelId = model?.modelId || params.modelId;
  const { provider, apiKey, transcript, rules, onProgress } = params;

  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  const chunks = splitTranscriptIntoChunks(transcript, 1500);
  const totalSteps = 1 + chunks.length; // 1 for analysis + N for translation chunks

  console.log(`[Transcript] ${wordCount} words, ${chunks.length} chunks`);

  // ── Step 1: Analysis (summary, topics, decisions, etc.) ──
  onProgress?.("Analyzing content...", 0, totalSteps);

  const analysisPrompt = buildTranscriptAnalysisPrompt(rules);
  // For analysis, send the full transcript (or first ~6000 words if very long)
  const analysisInput = wordCount > 6000
    ? transcript.split(/\s+/).slice(0, 6000).join(" ") + "\n\n[... transcript continues ...]"
    : transcript;

  const analysisRaw = await callLong(provider, apiKey, actualModelId, analysisPrompt, analysisInput);
  console.log("[Transcript] Analysis response length:", analysisRaw.length);

  const analysis = parseJSON(analysisRaw) || {
    title: "تحلیل جلسه",
    titleEn: "Meeting Analysis",
    summary: analysisRaw.trim().slice(0, 2000),
  };

  // ── Step 2: Translate each chunk ──
  const translatedChunks: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(`Translating part ${i + 1} of ${chunks.length}...`, 1 + i, totalSteps);

    const chunkPrompt = buildTranscriptChunkTranslatePrompt(i, chunks.length, rules);
    const chunkRaw = await callLong(provider, apiKey, actualModelId, chunkPrompt, chunks[i]);

    // Clean up any accidental JSON or code fences
    let translated = chunkRaw.trim();
    translated = translated.replace(/```[a-z]*\s*/g, "").replace(/```\s*/g, "");
    translatedChunks.push(translated);

    console.log(`[Transcript] Chunk ${i + 1}/${chunks.length} translated: ${translated.length} chars`);
  }

  // ── Step 3: Merge ──
  onProgress?.("Finalizing...", totalSteps, totalSteps);

  return {
    ...analysis,
    fullTranslation: translatedChunks.join("\n\n─────────────────────────────\n\n"),
    chunkCount: chunks.length,
    wordCount,
  };
}
