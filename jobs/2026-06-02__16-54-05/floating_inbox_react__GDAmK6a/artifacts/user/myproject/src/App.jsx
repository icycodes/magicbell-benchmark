import React, { useEffect, useState } from "react";
import Provider from "@magicbell/react/context-provider";
import FloatingInbox from "@magicbell/react/floating-inbox";
import "@magicbell/react/styles/floating-inbox.css";
import "./App.css";

function App() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/token")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.token) {
          setToken(data.token);
        } else {
          setError("No token returned from backend");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch MagicBell token:", err);
        setError(err.message);
      });
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-container">
          <span className="logo-text">SaaS Dashboard</span>
        </div>
        <div className="actions-container">
          {error && <span className="error-message">Error: {error}</span>}
          {!token && !error && <span className="loading-message">Fetching token...</span>}
          {token && (
            <Provider token={token}>
              <FloatingInbox placement="bottom-end" />
            </Provider>
          )}
        </div>
      </header>
      <main className="main-content">
        <div className="dashboard-card">
          <h1>Welcome to your SaaS Dashboard</h1>
          <p>
            This demo showcases the integration of the modern <code>@magicbell/react</code> FloatingInbox with a custom Node.js Express backend.
          </p>
          <div className="status-box">
            <h3>Connection Status:</h3>
            {token ? (
              <p className="status-success">✓ MagicBell Provider successfully initialized with User JWT.</p>
            ) : (
              <p className="status-pending">⚡ Waiting for User JWT...</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
