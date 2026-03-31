"use client";

import { useEffect } from "react";
import { isTauri } from "@/lib/auth";

export default function PwaRegistration() {
  useEffect(() => {
    if (isTauri()) return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[PWA] SW registration failed:", err);
    });
  }, []);

  return null;
}
