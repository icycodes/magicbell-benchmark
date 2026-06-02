import React, { useEffect, useState } from 'react';
import { Provider } from '@magicbell/react/context-provider';
import { FloatingInbox } from '@magicbell/react/floating-inbox';
import '@magicbell/react/styles/floating-inbox.css';
import './App.css';

export default function App() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/token')
      .then((res) => {
        if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setToken(data.token))
      .catch((err) => {
        console.error('Failed to fetch token:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <span className="app-title">MagicBell Demo</span>
        </header>
        <main className="app-main">
          <p className="error">Error: {error}</p>
        </main>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="app">
        <header className="app-header">
          <span className="app-title">MagicBell Demo</span>
        </header>
        <main className="app-main">
          <p>Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <Provider token={token}>
      <div className="app">
        <header className="app-header">
          <span className="app-title">MagicBell Floating Inbox Demo</span>
          <div className="header-actions">
            <FloatingInbox />
          </div>
        </header>
        <main className="app-main">
          <h1>Welcome to the MagicBell Demo</h1>
          <p>Click the bell icon in the header to open your notification inbox.</p>
        </main>
      </div>
    </Provider>
  );
}
