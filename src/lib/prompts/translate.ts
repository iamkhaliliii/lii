export function buildTranslatePrompt(detectTone: boolean): string {
  const base = `You are a professional English to Persian (Farsi) translator.
Translate the given English text to natural, modern Persian.
Use colloquial Persian when the source is informal.
Use formal Persian when the source is formal or professional.
Preserve technical terms in English when commonly used in Persian tech culture (e.g., API, deploy, commit).
Do NOT transliterate English words into Farsi script unless they are commonly used that way.`;

  if (!detectTone) {
    return (
      base +
      `\n\nReturn ONLY a JSON object with this structure (no markdown, no code fences):
{"translation": "the Persian translation"}`
    );
  }

  return (
    base +
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
    "suggested Farsi response 1",
    "suggested Farsi response 2",
    "suggested Farsi response 3"
  ]
}`
  );
}

export function buildImageTranslatePrompt(detectTone: boolean): string {
  const base = `Extract all English text from this image, then translate it to natural, modern Persian (Farsi).
Preserve technical terms in English when commonly used in Persian tech culture.`;

  if (!detectTone) {
    return (
      base +
      `\n\nReturn ONLY a JSON object (no markdown, no code fences):
{"extractedText": "the English text from the image", "translation": "the Persian translation"}`
    );
  }

  return (
    base +
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
    "suggested Farsi response 1",
    "suggested Farsi response 2",
    "suggested Farsi response 3"
  ]
}`
  );
}
