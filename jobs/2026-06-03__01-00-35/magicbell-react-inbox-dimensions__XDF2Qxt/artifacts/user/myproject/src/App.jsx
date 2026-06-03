import React, { useEffect, useState } from 'react';
import { MagicBellProvider, FloatingInbox } from '@magicbell/react';

function App() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/token')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch token: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.token) {
          setToken(data.token);
        } else {
          throw new Error('Token not found in response');
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h3>Error loading MagicBell Inbox</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ padding: '20px' }}>
        <h3>Loading MagicBell Inbox...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <h1>MagicBell React Inbox</h1>
      <MagicBellProvider token={token}>
        <div style={{ position: 'relative', marginTop: '20px' }}>
          <FloatingInbox height={500} width={400} defaultOpen={true} />
        </div>
      </MagicBellProvider>
    </div>
  );
}

export default App;
