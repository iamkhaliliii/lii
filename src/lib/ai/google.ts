import { GoogleGenAI } from "@google/genai";

export async function translateWithGoogle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.3,
    },
  });
  return response.text || "";
}

export async function translateImageWithGoogle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  imageBase64: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const match = imageBase64.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");
  const mimeType = match[1];
  const data = match[2];

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data } },
          { text: "Translate this image" },
        ],
      },
    ],
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.3,
    },
  });
  return response.text || "";
}
