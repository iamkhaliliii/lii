import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SLACK_BASE = "https://slack.com/api";

/**
 * Generic Slack API proxy — forwards GET and POST requests server-side
 * to bypass CORS in the browser/PWA context.
 *
 * GET  /api/slack?method=auth.test&token=xoxp-...&channel=C123
 * POST /api/slack  { method, token, body }
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const method = params.get("method");
  const token = params.get("token");

  if (!method || !token) {
    return NextResponse.json(
      { error: "Missing method or token" },
      { status: 400 }
    );
  }

  const url = new URL(`${SLACK_BASE}/${method}`);
  for (const [k, v] of params.entries()) {
    if (k !== "method" && k !== "token") {
      url.searchParams.set(k, v);
    }
  }

  try {
    const upstream = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await upstream.json();
    return NextResponse.json(data, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("slack proxy GET:", e);
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { method, token, body } = await request.json();

    if (!method || !token) {
      return NextResponse.json(
        { error: "Missing method or token" },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${SLACK_BASE}/${method}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await upstream.json();
    return NextResponse.json(data, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("slack proxy POST:", e);
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}
