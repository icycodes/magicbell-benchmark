import React, { useEffect, useState } from 'react';
import { MagicBellProvider, FloatingInbox } from '@magicbell/react';

const BACKEND_URL = 'http://localhost:3001';

export default function App() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/token`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setToken(data.token))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <h2>Error loading token</h2>
        <pre>{error}</pre>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <MagicBellProvider token={token}>
      <div style={{ padding: '2rem' }}>
        <h1>MagicBell React Inbox</h1>
        <p>Click the bell icon below to open your notifications.</p>
        <FloatingInbox height={500} width={400} />
      </div>
    </MagicBellProvider>
  );
}
