import { isTauri } from "./auth";
import { getHttpFetch } from "./http-fetch";
import type { TtsAccent } from "@/types";

/** Premade voices (ElevenLabs): US-style vs UK-style English defaults. */
export const ELEVENLABS_VOICE_US = "21m00Tcm4TlvDq8ikWAM"; // Rachel
export const ELEVENLABS_VOICE_GB = "JBFqnCBsd6RMkjVDRZzb"; // George (docs example)

const MAX_CHARS = 2500;

/** ElevenLabs playback speed — API default 1.0; UI clamps to this range. */
export const TTS_SPEED_MIN = 0.7;
export const TTS_SPEED_MAX = 1.3;
export const TTS_SPEED_DEFAULT = 1;

export type ElevenLabsVoiceRow = {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
  category?: string;
};

export function voiceIdForAccent(accent: TtsAccent): string {
  return accent === "gb" ? ELEVENLABS_VOICE_GB : ELEVENLABS_VOICE_US;
}

/** Pick voice: saved override per accent, else built-in default. */
export function resolveElevenLabsVoiceId(
  accent: TtsAccent,
  voiceUs?: string,
  voiceGb?: string
): string {
  if (accent === "gb") {
    const v = voiceGb?.trim();
    return v || ELEVENLABS_VOICE_GB;
  }
  const v = voiceUs?.trim();
  return v || ELEVENLABS_VOICE_US;
}

export function clampTtsSpeed(n: number): number {
  if (Number.isNaN(n)) return TTS_SPEED_DEFAULT;
  return Math.min(TTS_SPEED_MAX, Math.max(TTS_SPEED_MIN, n));
}

function useNextProxy(): boolean {
  if (typeof window === "undefined") return false;
  if (isTauri()) return false;
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") return false;
  return true;
}

function normalizeVoices(raw: unknown): ElevenLabsVoiceRow[] {
  if (!Array.isArray(raw)) return [];
  const out: ElevenLabsVoiceRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const voice_id = typeof o.voice_id === "string" ? o.voice_id : "";
    const name = typeof o.name === "string" ? o.name : voice_id || "Voice";
    if (!voice_id) continue;
    const labels =
      o.labels && typeof o.labels === "object" && !Array.isArray(o.labels)
        ? (o.labels as Record<string, string>)
        : undefined;
    const category = typeof o.category === "string" ? o.category : undefined;
    out.push({ voice_id, name, labels, category });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchElevenLabsVoices(apiKey: string): Promise<ElevenLabsVoiceRow[]> {
  const key = apiKey.trim();
  if (!key) throw new Error("Missing API key");

  if (useNextProxy()) {
    const res = await fetch("/api/elevenlabs/voices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    if (!res.ok) {
      let msg = `Voices request failed (${res.status})`;
      try {
        const j = (await res.json()) as { error?: string };
        if (j.error) msg = j.error;
      } catch {
        const t = await res.text();
        if (t) msg = t.slice(0, 200);
      }
      throw new Error(msg);
    }
    const data = (await res.json()) as { voices?: unknown };
    return normalizeVoices(data.voices);
  }

  const httpFetch = await getHttpFetch();
  const res = await httpFetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 240) || `ElevenLabs ${res.status}`);
  }
  const data = (await res.json()) as { voices?: unknown };
  return normalizeVoices(data.voices);
}

/**
 * Returns MP3 bytes from ElevenLabs. Uses same-origin proxy on web; direct HTTPS in Tauri.
 */
export async function fetchElevenLabsSpeech(params: {
  apiKey: string;
  text: string;
  accent: TtsAccent;
  voiceId?: string;
  speed?: number;
}): Promise<ArrayBuffer> {
  const trimmed = params.text.trim().slice(0, MAX_CHARS);
  if (!trimmed) throw new Error("No text to speak");

  const voiceId = params.voiceId?.trim() || voiceIdForAccent(params.accent);
  const speed = clampTtsSpeed(params.speed ?? TTS_SPEED_DEFAULT);

  const payload = JSON.stringify({
    text: trimmed,
    model_id: "eleven_multilingual_v2",
    voice_settings: { speed },
  });

  if (useNextProxy()) {
    const res = await fetch("/api/elevenlabs/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trimmed,
        accent: params.accent,
        apiKey: params.apiKey.trim(),
        voiceId,
        speed,
      }),
    });
    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try {
        const j = (await res.json()) as { error?: string };
        if (j.error) msg = j.error;
      } catch {
        const t = await res.text();
        if (t) msg = t.slice(0, 200);
      }
      throw new Error(msg);
    }
    return await res.arrayBuffer();
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
  const httpFetch = await getHttpFetch();
  const res = await httpFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": params.apiKey.trim(),
    },
    body: payload,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 240) || `ElevenLabs error ${res.status}`);
  }

  return await res.arrayBuffer();
}

/** Stable cache key for replay without a new API call. */
export function ttsCacheSignature(parts: {
  voiceId: string;
  speed: number;
  text: string;
}): string {
  return `${parts.voiceId}\x1e${parts.speed.toFixed(3)}\x1e${parts.text}`;
}
