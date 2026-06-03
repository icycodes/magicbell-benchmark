import React, { useEffect, useState } from 'react';
import { MagicBellProvider, FloatingInbox } from '@magicbell/react';

function App() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/token')
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          setToken(data.token);
        } else {
          setError('No token received from backend');
        }
      })
      .catch((err) => {
        console.error('Failed to fetch token:', err);
        setError('Failed to connect to backend');
      });
  }, []);

  if (error) {
    return (
      <div style={{ padding: 20, color: 'red' }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <p>Loading MagicBell inbox...</p>
      </div>
    );
  }

  return (
    <MagicBellProvider token={token}>
      <FloatingInbox
        placement="bottom-end"
        height={600}
        width={500}
        offset={20}
      />
    </MagicBellProvider>
  );
}

export default App;
