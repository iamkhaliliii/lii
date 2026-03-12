import Anthropic from "@anthropic-ai/sdk";

export function createAnthropicClient(apiKey: string) {
  return new Anthropic({ apiKey });
}

export async function translateWithAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const client = createAnthropicClient(apiKey);
  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

export async function translateImageWithAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  imageBase64: string
): Promise<string> {
  const client = createAnthropicClient(apiKey);

  // Extract media type and data from data URL
  const match = imageBase64.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");
  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const data = match[2];

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data },
          },
        ],
      },
    ],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
