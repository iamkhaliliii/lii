export type AIProvider = "openai" | "anthropic" | "google";

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  modelId: string;
  supportsVision: boolean;
}

export interface ProviderConfig {
  apiKey: string;
  defaultModel: string;
}

export interface TranslationRequest {
  text: string;
  detectTone: boolean;
}

export interface ImageTranslationRequest {
  image: string; // base64 data URL
}

export interface ToneAnalysis {
  formality: "formal" | "semi-formal" | "informal" | "casual";
  sentiment: "positive" | "neutral" | "negative" | "urgent";
  likelySender: string;
  context: string;
  suggestedResponseTone: string;
}

export interface TranslationResult {
  id: string;
  originalText: string;
  translatedText: string;
  tone?: ToneAnalysis;
  suggestedResponses?: string[];
  provider: AIProvider;
  model: string;
  timestamp: number;
  source: "text" | "image";
}

export interface HistoryEntry extends TranslationResult {
  starred: boolean;
}

export interface AppSettings {
  providers: Record<AIProvider, ProviderConfig>;
  activeProvider: AIProvider;
  activeModel: string;
  autoDetectTone: boolean;
  autoSuggestResponse: boolean;
  theme: "light" | "dark" | "system";
}
