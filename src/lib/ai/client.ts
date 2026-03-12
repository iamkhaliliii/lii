import { AIProvider } from "@/types";
import { getModelById } from "./providers";
import { translateWithOpenAI, translateImageWithOpenAI } from "./openai";
import { translateWithAnthropic, translateImageWithAnthropic } from "./anthropic";
import { translateWithGoogle, translateImageWithGoogle } from "./google";

interface TranslateParams {
  provider: AIProvider;
  apiKey: string;
  modelId: string;
  systemPrompt: string;
  text: string;
}

interface TranslateImageParams {
  provider: AIProvider;
  apiKey: string;
  modelId: string;
  systemPrompt: string;
  imageBase64: string;
}

export async function translate(params: TranslateParams): Promise<string> {
  const model = getModelById(params.modelId);
  const actualModelId = model?.modelId || params.modelId;

  switch (params.provider) {
    case "openai":
      return translateWithOpenAI(params.apiKey, actualModelId, params.systemPrompt, params.text);
    case "anthropic":
      return translateWithAnthropic(params.apiKey, actualModelId, params.systemPrompt, params.text);
    case "google":
      return translateWithGoogle(params.apiKey, actualModelId, params.systemPrompt, params.text);
    default:
      throw new Error(`Unsupported provider: ${params.provider}`);
  }
}

export async function translateImage(params: TranslateImageParams): Promise<string> {
  const model = getModelById(params.modelId);
  const actualModelId = model?.modelId || params.modelId;

  switch (params.provider) {
    case "openai":
      return translateImageWithOpenAI(params.apiKey, actualModelId, params.systemPrompt, params.imageBase64);
    case "anthropic":
      return translateImageWithAnthropic(params.apiKey, actualModelId, params.systemPrompt, params.imageBase64);
    case "google":
      return translateImageWithGoogle(params.apiKey, actualModelId, params.systemPrompt, params.imageBase64);
    default:
      throw new Error(`Unsupported provider: ${params.provider}`);
  }
}
