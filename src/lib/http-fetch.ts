import { isTauri } from "./auth";

/** Prefer Tauri HTTP plugin in desktop (CORS-safe); else browser fetch. */
let fetchPromise: Promise<typeof globalThis.fetch> | null = null;

export function getHttpFetch(): Promise<typeof globalThis.fetch> {
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    if (isTauri()) {
      try {
        const mod = await import("@tauri-apps/plugin-http");
        return mod.fetch as unknown as typeof globalThis.fetch;
      } catch (e) {
        console.warn("Tauri HTTP plugin not available, falling back to browser fetch", e);
      }
    }
    return globalThis.fetch;
  })();

  return fetchPromise;
}
