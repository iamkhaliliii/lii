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
  detectedSender?: string | null;
  context: string;
  suggestedResponseTone: string;
}

// === NEW: Bilingual suggestion pair ===
export interface BilingualSuggestion {
  english: string;
  farsi: string;
}

export interface TranslationResult {
  id: string;
  originalText: string;
  translatedText: string;
  tone?: ToneAnalysis;
  suggestedResponses?: BilingualSuggestion[];
  needsResponse?: boolean;
  provider: AIProvider;
  model: string;
  timestamp: number;
  source: "text" | "image";
  contactId?: string;
}

export interface HistoryEntry extends TranslationResult {
  starred: boolean;
}

export interface AuthUser {
  email: string;
  name: string;
  picture: string;
  token: string;
  expiresAt: number;
}

export interface SlackConfig {
  token: string;
  connected: boolean;
  pinnedChannels?: string[];
}

export interface SlackConversation {
  id: string;
  name: string;
  type: "dm" | "channel" | "group" | "mpim";
  userId?: string;
  userName?: string;
  avatarUrl?: string;
  memberAvatars?: string[];
  unreadCount?: number;
  lastMessage?: string;
  lastTimestamp?: number;
  isMember?: boolean;
  pinned?: boolean;
}

export interface SlackMessage {
  ts: string;
  userId: string;
  userName?: string;
  avatarUrl?: string;
  text: string;
  timestamp: number;
  threadTs?: string;
  isThread?: boolean;
  replyCount?: number;
}

export interface SlackUser {
  id: string;
  name: string;
  realName: string;
  displayName: string;
  avatarUrl?: string;
  isBot?: boolean;
}

export interface TranslationRule {
  id: string;
  text: string;
  enabled: boolean;
  createdAt: number;
}

export interface AppSettings {
  providers: Record<AIProvider, ProviderConfig>;
  activeProvider: AIProvider;
  activeModel: string;
  autoDetectTone: boolean;
  autoSuggestResponse: boolean;
  theme: "light" | "dark" | "system";
  slack?: SlackConfig;
  rules?: TranslationRule[];
}

// === NEW: Per-Person Contact ===
export type ContactRelationship = "boss" | "colleague" | "friend" | "client" | "family" | "other";

export const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#f97316", "#6366f1",
] as const;

export interface Contact {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string;  // profile picture URL or base64 data URL
  relationship: ContactRelationship;
  preferredFormality: "formal" | "semi-formal" | "informal" | "casual";
  communicationNotes: string;  // AI-generated summary of style patterns
  lastInteraction: number;
  messageCount: number;
  createdAt: number;
}

// === NEW: Per-Person Message Log ===
export interface ContactMessage {
  id: string;
  contactId: string;
  direction: "from_them" | "to_them";
  originalText: string;
  translatedText: string;
  tone?: ToneAnalysis;
  timestamp: number;
}

// === NEW: Person Context for prompts ===
export interface PersonContext {
  name: string;
  relationship: string;
  preferredFormality: string;
  communicationNotes: string;
  recentMessages: Array<{ direction: string; text: string }>;
}

// === Chat Architecture ===

export interface Conversation {
  id: string;
  title: string;
  contactId?: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessagePreview: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  contactId?: string;
  direction: "incoming" | "outgoing";
  originalText: string;
  translatedText: string;
  tone?: ToneAnalysis;
  suggestedResponses?: BilingualSuggestion[];
  needsResponse?: boolean;
  source: "text" | "image";
  polishedReply?: string;
  provider?: string;
  model?: string;
  timestamp: number;
}
