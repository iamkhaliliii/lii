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
