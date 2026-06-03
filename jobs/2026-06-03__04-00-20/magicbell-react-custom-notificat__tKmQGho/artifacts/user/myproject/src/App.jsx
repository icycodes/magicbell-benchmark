import React, { useState, useEffect } from 'react';
import { Provider, FloatingInbox } from '@magicbell/react';
import CustomNotificationItem from './CustomNotificationItem';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/token')
      .then((res) => res.json())
      .then((data) => {
        setToken(data.token);
      })
      .catch((err) => {
        console.error('Failed to fetch token:', err);
      });
  }, []);

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <Provider apiKey={process.env.MAGICBELL_API_KEY || ''} userEmail="" userExternalId={`user-${process.env.ZEALT_RUN_ID || '1'}`} userKey={token}>
      <div style={{ padding: '20px' }}>
        <h1>MagicBell Notifications</h1>
        <FloatingInbox
          ItemComponent={CustomNotificationItem}
        />
      </div>
    </Provider>
  );
}

export default App;