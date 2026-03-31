import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 400 });
    }

    const upstream = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      return NextResponse.json(
        { error: t.slice(0, 300) || `ElevenLabs ${upstream.status}` },
        { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 }
      );
    }

    const data = (await upstream.json()) as { voices?: unknown[] };
    return NextResponse.json({ voices: data.voices ?? [] });
  } catch (e) {
    console.error("elevenlabs voices proxy:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
