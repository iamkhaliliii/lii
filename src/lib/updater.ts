export async function checkForAppUpdates() {
  // Only run in Tauri context
  if (typeof window === "undefined" || !("__TAURI__" in window)) {
    console.log("[updater] Not in Tauri context, skipping");
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
    console.error("Update check failed:", e);
    return null;
  }
}
