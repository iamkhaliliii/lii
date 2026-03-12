import { AIModel, AIProvider } from "@/types";

export const models: AIModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    modelId: "gpt-4o",
    supportsVision: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    modelId: "gpt-4o-mini",
    supportsVision: true,
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    modelId: "claude-sonnet-4-20250514",
    supportsVision: true,
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku 3.5",
    provider: "anthropic",
    modelId: "claude-haiku-4-5-20251001",
    supportsVision: true,
  },
  {
    id: "gemini-2-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    modelId: "gemini-2.0-flash",
    supportsVision: true,
  },
];

export function getModelsForProvider(provider: AIProvider): AIModel[] {
  return models.filter((m) => m.provider === provider);
}

export function getModelById(id: string): AIModel | undefined {
  return models.find((m) => m.id === id);
}

export const providerNames: Record<AIProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
};
