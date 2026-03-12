"use client";
import { useState, useEffect, ReactNode } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Lock } from "lucide-react";
import {
  getAuthUser,
  setAuthUser,
  decodeGoogleJwt,
  isTauri,
  verifyAdminPassword,
  loginAsAdmin,
} from "@/lib/auth";

const GOOGLE_CLIENT_ID =
  "72760618578-ld81i1klg5uhsun6k7bim9psml68ga6p.apps.googleusercontent.com";

export default function AuthGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState(false);

  useEffect(() => {
    if (isTauri()) {
      setAuthenticated(true);
      setLoading(false);
      return;
    }
    setAuthenticated(getAuthUser() !== null);
    setLoading(false);

    const handler = () => setAuthenticated(getAuthUser() !== null);
    window.addEventListener("lii-auth-changed", handler);
    return () => window.removeEventListener("lii-auth-changed", handler);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-primary">lii</h1>
            <p className="text-sm text-muted">
              AI-powered Translation Assistant
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8">
            <p className="mb-4 text-center text-sm text-muted">
              Sign in to continue
            </p>
            <GoogleLogin
              onSuccess={(response) => {
                if (response.credential) {
                  const decoded = decodeGoogleJwt(response.credential);
                  setAuthUser({
                    email: decoded.email,
                    name: decoded.name,
                    picture: decoded.picture,
                    token: response.credential,
                    expiresAt: decoded.exp * 1000,
                  });
                }
              }}
              onError={() => {
                console.error("Google Sign-In failed");
              }}
              shape="rectangular"
              size="large"
              width={280}
            />
            <div className="mt-4 border-t border-border pt-4">
              {!showAdmin ? (
                <button
                  onClick={() => setShowAdmin(true)}
                  className="flex w-full items-center justify-center gap-1.5 text-xs text-muted hover:text-foreground"
                >
                  <Lock size={12} />
                  Admin
                </button>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setAdminError(false);
                    const ok = await verifyAdminPassword(adminPass);
                    if (ok) {
                      loginAsAdmin();
                    } else {
                      setAdminError(true);
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="password"
                    value={adminPass}
                    onChange={(e) => {
                      setAdminPass(e.target.value);
                      setAdminError(false);
                    }}
                    placeholder="Password"
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-sm focus:outline-none ${
                      adminError
                        ? "border-danger"
                        : "border-border focus:border-primary"
                    }`}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-hover"
                  >
                    Go
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
