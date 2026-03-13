export function buildSummaryPrompt(
  contactName: string,
  existingSummary: string | null,
  recentMessages: Array<{
    direction: string;
    text: string;
    timestamp: number;
  }>
): string {
  const messagesBlock = recentMessages
    .map((m) => {
      const label = m.direction === "from_them" ? contactName : "User";
      return `${label}: ${m.text}`;
    })
    .join("\n");

  const existingBlock = existingSummary
    ? `\nPrevious summary: ${existingSummary}\n`
    : "";

  return `Analyze the communication pattern between the user and "${contactName}".
${existingBlock}
Recent messages:
${messagesBlock}

Based on the messages, generate a brief communication profile.

Return ONLY a JSON object (no markdown, no code fences):
{
  "summary": "2-3 sentence summary of how these two communicate, in English",
  "topicsDiscussed": ["topic1", "topic2", "topic3"],
  "typicalTone": "description of the typical tone (e.g. friendly but professional)",
  "typicalFormality": "formal|semi-formal|informal|casual"
}`;
}
