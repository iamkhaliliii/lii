export async function checkForAppUpdates() {
  // Only run in Tauri context
  if (typeof window === "undefined" || !("__TAURI__" in window)) {
    return null;
  }

  // During `tauri dev` / Next dev, hitting GitHub often fails (TLS, proxies, or dev quirks)
  // and spams the console — production desktop builds use NODE_ENV=production.
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  try {
    console.log("[updater] Checking for updates...");
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");

    const update = await check();
    if (!update) {
      console.log("[updater] No update available (already latest)");
      return null;
    }

    console.log("[updater] Update found:", update.version);

    return {
      version: update.version,
      body: update.body || "",
      downloadAndInstall: async (
        onProgress?: (percent: number) => void
      ) => {
        let downloaded = 0;
        let total = 0;

        try {
          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case "Started":
                total = event.data.contentLength ?? 0;
                console.log("[updater] Download started, size:", total);
                break;
              case "Progress":
                downloaded += event.data.chunkLength;
                if (total > 0 && onProgress) {
                  onProgress(Math.round((downloaded / total) * 100));
                }
                break;
              case "Finished":
                console.log("[updater] Download finished, installing...");
                break;
            }
          });
          console.log("[updater] Install complete, relaunching...");
          await relaunch();
        } catch (e) {
          console.error("[updater] Download/install failed:", e);
          throw e;
        }
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Network / GitHub unreachable — don't treat as app failure; banner stays hidden
    console.warn(
      "[updater] Update check skipped:",
      msg.includes("github.com") || msg.includes("sending request")
        ? "could not reach update manifest (offline, firewall, or regional network)."
        : msg
    );
    return null;
  }
}
