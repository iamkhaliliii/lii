import { NextRequest, NextResponse } from "next/server";
import type { TtsAccent } from "@/types";
import { clampTtsSpeed, voiceIdForAccent } from "@/lib/elevenlabs-tts";

export const dynamic = "force-dynamic";

const MAX_CHARS = 2500;

/** Basic guard: ElevenLabs voice IDs are alphanumeric + some chars */
function sanitizeVoiceId(id: string): string | null {
  const t = id.trim();
  if (t.length < 8 || t.length > 64) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(t)) return null;
  return t;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_CHARS) : "";
    const accent = body.accent as TtsAccent;
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const rawVoice = typeof body.voiceId === "string" ? body.voiceId.trim() : "";
    const speedRaw = typeof body.speed === "number" ? body.speed : 1;
    const speed = clampTtsSpeed(speedRaw);

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "Missing ElevenLabs API key" }, { status: 400 });
    }
    if (accent !== "us" && accent !== "gb") {
      return NextResponse.json({ error: "accent must be us or gb" }, { status: 400 });
    }

    const sanitized = rawVoice ? sanitizeVoiceId(rawVoice) : null;
    const voiceId = sanitized || voiceIdForAccent(accent);

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

    const upstreamBody: Record<string, unknown> = {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { speed },
    };

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify(upstreamBody),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return NextResponse.json(
        { error: errText.slice(0, 300) || `ElevenLabs ${upstream.status}` },
        { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 }
      );
    }

    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("elevenlabs tts proxy:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
