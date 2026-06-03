import React, { useState, useEffect } from 'react';
import { Provider, FloatingInbox } from '@magicbell/react';

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
    <Provider
      apiKey={process.env.REACT_APP_MAGICBELL_API_KEY}
      userEmail={process.env.REACT_APP_MAGICBELL_EMAIL}
      userExternalId={process.env.REACT_APP_MAGICBELL_EXTERNAL_ID}
      userKey={token}
    >
      <div style={{ padding: '20px' }}>
        <h1>MagicBell Notifications</h1>
        <p>Click the bell icon to view your notifications.</p>
      </div>
      <FloatingInbox
        placement="bottom-end"
        height={600}
        width={500}
        offset={20}
      />
    </Provider>
  );
}

export default App;