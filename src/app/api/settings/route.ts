import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/db/auth-verify";
import { getUserSettings, upsertUserSettings } from "@/lib/db";
import { AppSettings } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getUserSettings(user.email);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settings = body.settings as AppSettings;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid settings payload" },
        { status: 400 }
      );
    }

    if (!settings.providers || !settings.activeProvider || !settings.activeModel) {
      return NextResponse.json(
        { error: "Missing required settings fields" },
        { status: 400 }
      );
    }

    await upsertUserSettings(user.email, settings);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
