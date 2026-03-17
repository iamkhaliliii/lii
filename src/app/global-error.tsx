"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: "#666", fontSize: 13, marginBottom: 4 }}>{error.message}</p>
          <p style={{ color: "#999", fontSize: 11, marginBottom: 20 }}>Try clearing app data if this persists after an update.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{ background: "#6366f1", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
            >
              Try Again
            </button>
            <button
              onClick={() => { try { localStorage.clear(); } catch {} window.location.reload(); }}
              style={{ background: "#f1f1f1", border: "1px solid #ddd", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
            >
              Clear Data & Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
