import OpenAI from "openai";

export function createOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

export async function translateWithOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const client = createOpenAIClient(apiKey);
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
  });
  return response.choices[0]?.message?.content || "";
}

export async function translateImageWithOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  imageBase64: string
): Promise<string> {
  const client = createOpenAIClient(apiKey);
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      },
    ],
    temperature: 0.3,
  });
  return response.choices[0]?.message?.content || "";
}
