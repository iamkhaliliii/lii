import { AuthUser } from "@/types";

const AUTH_KEY = "lii-auth";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;
    const user: AuthUser = JSON.parse(stored);
    if (user.expiresAt && Date.now() > user.expiresAt) {
      clearAuth();
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("lii-auth-changed"));
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event("lii-auth-changed"));
}

export function isAuthenticated(): boolean {
  return isTauri() || getAuthUser() !== null;
}

const ADMIN_HASH =
  "c7d9dd8c3956d2263f2815cf179dd21b9368c48de6d2b2695916bfd146822a09";
const ADMIN_B64 = "bGlpMjAyNA==";

export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const encoded = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex === ADMIN_HASH;
  } catch {
    return btoa(password) === ADMIN_B64;
  }
}

export function loginAsAdmin(): void {
  setAuthUser({
    email: "admin@lii.app",
    name: "Admin",
    picture: "",
    token: "admin",
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

export function decodeGoogleJwt(token: string): {
  email: string;
  name: string;
  picture: string;
  exp: number;
} {
  const payload = token.split(".")[1];
  const decoded = JSON.parse(atob(payload));
  return {
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
    exp: decoded.exp,
  };
}
