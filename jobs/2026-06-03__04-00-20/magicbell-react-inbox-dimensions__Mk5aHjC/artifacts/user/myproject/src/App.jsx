import React, { useEffect, useState } from 'react';
import { MagicBellProvider, FloatingInbox } from '@magicbell/react';

function App() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/token')
      .then((res) => res.json())
      .then((data) => {
        setToken(data.token);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return <div>Error loading token: {error}</div>;
  }

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <MagicBellProvider token={token}>
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>MagicBell React Inbox</h1>
        <FloatingInbox height={500} width={400} />
      </div>
    </MagicBellProvider>
  );
}

export default App;