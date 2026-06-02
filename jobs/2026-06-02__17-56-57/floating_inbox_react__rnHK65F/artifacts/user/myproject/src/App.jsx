import { useEffect, useState } from "react";
import MagicBellProvider from "@magicbell/react/context-provider";
import FloatingInbox from "@magicbell/react/floating-inbox";
import "@magicbell/react/styles/floating-inbox.css";

const projectToken = import.meta.env.VITE_MAGICBELL_PROJECT_TOKEN;
const runId = import.meta.env.VITE_ZEALT_RUN_ID;

const App = () => {
  const [userToken, setUserToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadToken = async () => {
      try {
        const response = await fetch("/token");
        if (!response.ok) {
          throw new Error(`Token request failed: ${response.status}`);
        }
        const data = await response.json();
        setUserToken(data.token);
      } catch (err) {
        setError(err.message || "Failed to load token");
      }
    };

    loadToken();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">MagicBell Demo</p>
          <h1>Floating Inbox</h1>
          <p className="muted">Run ID: {runId || "(missing VITE_ZEALT_RUN_ID)"}</p>
        </div>
        <div className="bell-container">
          {error ? (
            <span className="error">{error}</span>
          ) : userToken ? (
            <MagicBellProvider apiKey={projectToken} userToken={userToken}>
              <FloatingInbox placement="bottom-end" />
            </MagicBellProvider>
          ) : (
            <span className="loading">Loading inbox…</span>
          )}
        </div>
      </header>
      <main className="content">
        <p>
          The floating inbox is connected to MagicBell using a signed user JWT
          from the Express backend. Click the bell icon to open the inbox and see
          the seeded notification titled <strong>Floating Inbox - {runId}</strong>.
        </p>
      </main>
    </div>
  );
};

export default App;
