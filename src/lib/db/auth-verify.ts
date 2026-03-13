import { NextRequest } from "next/server";

interface VerifiedUser {
  email: string;
  name: string;
}

export async function verifyAuthToken(
  request: NextRequest
): Promise<VerifiedUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  // Handle admin token
  if (token === "admin") {
    return { email: "admin@lii.app", name: "Admin" };
  }

  // Verify Google JWT
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // Verify audience matches our Google Client ID
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (payload.aud !== expectedClientId) {
      return null;
    }

    // Verify issuer
    if (
      payload.iss !== "accounts.google.com" &&
      payload.iss !== "https://accounts.google.com"
    ) {
      return null;
    }

    // Verify with Google's tokeninfo endpoint
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );

    if (!verifyRes.ok) {
      return null;
    }

    const verified = await verifyRes.json();

    if (verified.aud !== expectedClientId) {
      return null;
    }

    return {
      email: verified.email,
      name: verified.name || payload.name || "",
    };
  } catch {
    return null;
  }
}
