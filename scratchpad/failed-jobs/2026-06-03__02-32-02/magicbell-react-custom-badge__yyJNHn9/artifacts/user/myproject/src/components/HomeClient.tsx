"use client";

import MagicBellInbox from "./MagicBellInbox";

export default function HomeClient() {
  async function sendBroadcast() {
    const btn = document.getElementById("send-broadcast-btn") as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending...";
    }
    try {
      const res = await fetch("/api/broadcast", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(
          `Broadcast sent to ${data.email}!\nCheck the bell icon — the unread badge will appear shortly.`
        );
      } else {
        alert(`Error: ${data.error || JSON.stringify(data)}`);
      }
    } catch (err) {
      alert(`Request failed: ${(err as Error).message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Send Test Notification";
      }
    }
  }

  return (
    <main style={{ minHeight: "100vh", fontFamily: "sans-serif", background: "#f9fafb" }}>
      {/* Nav bar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.5rem",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "1.25rem", color: "#6E56CF" }}>
          MyApp
        </div>
        <MagicBellInbox />
      </nav>

      {/* Content */}
      <div
        style={{
          maxWidth: "640px",
          margin: "3rem auto",
          padding: "2rem",
          background: "#fff",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111", marginTop: 0 }}>
          MagicBell Custom Tabs Demo
        </h1>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          The bell icon in the top-right shows an unread badge count. Click it to
          open the floating inbox, which has two tabs:
        </p>
        <ul style={{ color: "#555", lineHeight: 1.8, paddingLeft: "1.5rem" }}>
          <li>
            <strong>All</strong> – shows every notification (unread &amp; read)
          </li>
          <li>
            <strong>Unread</strong> – shows only unread notifications
          </li>
        </ul>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          The badge count on the bell always reflects the <em>global</em> unread
          count, regardless of which tab is selected inside.
        </p>

        <button
          id="send-broadcast-btn"
          onClick={sendBroadcast}
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1.5rem",
            background: "#6E56CF",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "1rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Send Test Notification
        </button>
      </div>
    </main>
  );
}
