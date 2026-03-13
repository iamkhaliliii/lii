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
Do NOT transliterate English words into Farsi script unless they are commonly used that way.

IMPORTANT for formatting:
- Use **bold** (double asterisks) to highlight key points, important terms, action items, deadlines, names, and critical information in the translation
- Only bold the most important 1-3 phrases per message — do NOT over-bold
- Examples: **دیپلوی جدید**, **مشکل در API**, **تا فردا**`;

  const personBlock = personContext
    ? buildPersonContextBlock(personContext)
    : "";

  if (!detectTone) {
    return (
      base +
      personBlock +
      `\n\nReturn ONLY a JSON object with this structure (no markdown, no code fences):
{"translation": "the Persian translation", "needsResponse": true}

IMPORTANT for needsResponse:
- true if the message asks a question, requests action, or expects a reply
- false for announcements, FYI, status updates, automated notifications, or purely informational messages
- When in doubt, set to true`
    );
  }

  return (
    base +
    personBlock +
    `\n\nAlso analyze the tone and context of the original message.

Return ONLY a JSON object with this structure (no markdown, no code fences):
{
  "translation": "the Persian translation",
  "needsResponse": true,
  "tone": {
    "formality": "formal|semi-formal|informal|casual",
    "sentiment": "positive|neutral|negative|urgent",
    "likelySender": "who likely sent this (e.g. boss, colleague, friend, customer, automated system)",
    "detectedSender": "the actual name of the person who sent this, or null if unknown",
    "context": "brief context description in Persian",
    "suggestedResponseTone": "how to respond (e.g. polite-formal, friendly-casual)"
  },
  "suggestedResponses": [
    {"english": "English reply suggestion 1", "farsi": "Persian translation of reply 1"},
    {"english": "English reply suggestion 2", "farsi": "Persian translation of reply 2"},
    {"english": "English reply suggestion 3", "farsi": "Persian translation of reply 3"}
  ]
}

IMPORTANT for needsResponse:
- true if the message asks a question, requests action, or expects a reply
- false for announcements, FYI, status updates, automated notifications
- When in doubt, set to true

IMPORTANT for detectedSender:
- Look for the actual name of the person in the message (greetings, signatures, chat headers)
- Examples: "Hi, this is Sarah from marketing" → "Sarah", "Best regards, John" → "John"
- Return null if no name can be determined from the text
- This is the person's NAME, not their role (role goes in likelySender)

IMPORTANT for suggestedResponses:
- "english" is the actual English reply the user would send back to the sender
- "farsi" is the Persian translation so the user understands what they are saying
- Make English replies natural and appropriate for the context
- If needsResponse is false, return an empty array []`
  );
}

export function buildPolishReplyPrompt(originalMessage: string): string {
  return `You are a reply assistant. The user is composing a reply to this message:

"${originalMessage}"

The user's draft reply may be in:
- English (possibly with grammar errors)
- Farsi (Persian)
- Finglish (Persian written in Latin alphabet)
- A mix of any of the above

Your job:
1. Detect the language of the draft
2. Produce a polished, natural English reply that is ready to send
3. If the draft is in Farsi or Finglish, translate it to natural English
4. If the draft is in English, fix grammar, spelling, and make it professional yet natural
5. Keep the user's intended meaning and tone — don't change what they want to say
6. Keep it concise — don't add unnecessary words

Return ONLY a JSON object (no markdown, no code fences):
{
  "polished": "the polished English reply ready to send",
  "farsi": "Persian translation of the polished reply"
}`;
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
{"extractedText": "the English text from the image", "translation": "the Persian translation", "needsResponse": true}

IMPORTANT for needsResponse:
- true if the message asks a question, requests action, or expects a reply
- false for announcements, FYI, status updates, automated notifications
- When in doubt, set to true`
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
  "needsResponse": true,
  "tone": {
    "formality": "formal|semi-formal|informal|casual",
    "sentiment": "positive|neutral|negative|urgent",
    "likelySender": "who likely sent this",
    "detectedSender": "the actual name of the person who sent this, or null if unknown",
    "context": "brief context description in Persian",
    "suggestedResponseTone": "how to respond"
  },
  "suggestedResponses": [
    {"english": "English reply suggestion 1", "farsi": "Persian translation of reply 1"},
    {"english": "English reply suggestion 2", "farsi": "Persian translation of reply 2"},
    {"english": "English reply suggestion 3", "farsi": "Persian translation of reply 3"}
  ]
}

IMPORTANT for needsResponse:
- true if the message asks a question, requests action, or expects a reply
- false for announcements, FYI, status updates, automated notifications

IMPORTANT for detectedSender:
- Look for the actual name in the message. Return null if unknown.

IMPORTANT for suggestedResponses:
- "english" is the actual English reply the user would send back
- "farsi" is the Persian translation
- If needsResponse is false, return an empty array []`
  );
}
