"use client";
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#F6F6F6", color: "#222222", margin: 0 }}>
        <div style={{ maxWidth: 560, margin: "15vh auto", background: "#fff", border: "1px solid #DADADA", borderRadius: 8, padding: 32 }}>
          <h1 style={{ color: "#191919", marginTop: 0 }}>Service temporarily unavailable</h1>
          <p>The journal website could not load. If this is a new installation, make sure a PostgreSQL database is connected (DATABASE_URL) and redeploy.</p>
          <button onClick={reset} style={{ background: "#191919", color: "#fff", border: 0, borderRadius: 6, padding: "8px 16px", cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
