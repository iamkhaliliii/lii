import { PersonContext } from "@/types";

function buildPersonContextBlock(ctx: PersonContext): string {
  let block = `\n\n--- CONVERSATION CONTEXT ---
You are helping the user communicate with "${ctx.name}" (${ctx.relationship}).
Preferred formality with this person: ${ctx.preferredFormality}.`;

  if (ctx.communicationNotes) {
    block += `\nCommunication style notes: ${ctx.communicationNotes}`;
  }

  if (ctx.recentMessages.length > 0) {
    block += `\n\nRecent conversation:`;
    for (const msg of ctx.recentMessages) {
      const label = msg.direction === "from_them" ? ctx.name : "User";
      block += `\n${label}: ${msg.text}`;
    }
  }

  block += `\n\nWhen suggesting responses:
- Match the tone and formality the user typically uses with ${ctx.name}
- Consider the conversation context above
- Make responses feel natural for a ${ctx.relationship} relationship`;

  return block;
}

export function buildTranslatePrompt(
  detectTone: boolean,
  personContext?: PersonContext
): string {
  const base = `You are a professional English to Persian (Farsi) translator.
Translate the given English text to natural, modern Persian.
Use colloquial Persian when the source is informal.
Use formal Persian when the source is formal or professional.
Preserve technical terms in English when commonly used in Persian tech culture (e.g., API, deploy, commit).
Do NOT transliterate English words into Farsi script unless they are commonly used that way.`;

  const personBlock = personContext
    ? buildPersonContextBlock(personContext)
    : "";

  if (!detectTone) {
    return (
      base +
      personBlock +
      `\n\nReturn ONLY a JSON object with this structure (no markdown, no code fences):
{"translation": "the Persian translation"}`
    );
  }

  return (
    base +
    personBlock +
    `\n\nAlso analyze the tone and context of the original message.

Return ONLY a JSON object with this structure (no markdown, no code fences):
{
  "translation": "the Persian translation",
  "tone": {
    "formality": "formal|semi-formal|informal|casual",
    "sentiment": "positive|neutral|negative|urgent",
    "likelySender": "who likely sent this (e.g. boss, colleague, friend, customer, automated system)",
    "context": "brief context description in Persian",
    "suggestedResponseTone": "how to respond (e.g. polite-formal, friendly-casual)"
  },
  "suggestedResponses": [
    {"english": "English reply suggestion 1", "farsi": "Persian translation of reply 1"},
    {"english": "English reply suggestion 2", "farsi": "Persian translation of reply 2"},
    {"english": "English reply suggestion 3", "farsi": "Persian translation of reply 3"}
  ]
}

IMPORTANT for suggestedResponses:
- "english" is the actual English reply the user would send back to the sender
- "farsi" is the Persian translation so the user understands what they are saying
- Make English replies natural and appropriate for the context`
  );
}

export function buildImageTranslatePrompt(
  detectTone: boolean,
  personContext?: PersonContext
): string {
  const base = `Extract all English text from this image, then translate it to natural, modern Persian (Farsi).
Preserve technical terms in English when commonly used in Persian tech culture.`;

  const personBlock = personContext
    ? buildPersonContextBlock(personContext)
    : "";

  if (!detectTone) {
    return (
      base +
      personBlock +
      `\n\nReturn ONLY a JSON object (no markdown, no code fences):
{"extractedText": "the English text from the image", "translation": "the Persian translation"}`
    );
  }

  return (
    base +
    personBlock +
    `\n\nAlso analyze the tone and context.

Return ONLY a JSON object (no markdown, no code fences):
{
  "extractedText": "the English text from the image",
  "translation": "the Persian translation",
  "tone": {
    "formality": "formal|semi-formal|informal|casual",
    "sentiment": "positive|neutral|negative|urgent",
    "likelySender": "who likely sent this",
    "context": "brief context description in Persian",
    "suggestedResponseTone": "how to respond"
  },
  "suggestedResponses": [
    {"english": "English reply suggestion 1", "farsi": "Persian translation of reply 1"},
    {"english": "English reply suggestion 2", "farsi": "Persian translation of reply 2"},
    {"english": "English reply suggestion 3", "farsi": "Persian translation of reply 3"}
  ]
}

IMPORTANT for suggestedResponses:
- "english" is the actual English reply the user would send back
- "farsi" is the Persian translation so the user understands what they are saying`
  );
}
