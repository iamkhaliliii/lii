"use client";
import { useState, useEffect } from "react";
import { AuthUser } from "@/types";
import { getAuthUser, clearAuth, isTauri } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getAuthUser());
    setIsLoading(false);

    const handler = () => setUser(getAuthUser());
    window.addEventListener("lii-auth-changed", handler);
    return () => window.removeEventListener("lii-auth-changed", handler);
  }, []);

  return {
    user,
    isAuthenticated: isTauri() || user !== null,
    isLoading,
    logout: clearAuth,
  };
}
