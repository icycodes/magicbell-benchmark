import React, { useEffect, useState } from 'react';
import { MagicBellProvider, FloatingInbox } from '@magicbell/react';
import '@magicbell/react/dist/styles.css';

function App() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <MagicBellProvider
      apiKey={config.apiKey}
      userEmail={config.userEmail}
      userKey={config.userKey}
    >
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>MagicBell Custom Tabs Demo</h1>
        <p>Click the bell icon to see your notifications.</p>
        <FloatingInbox
          tabs={[
            { name: 'All', storeId: 'default' },
            { name: 'Unread', storeId: 'unread', filter: { read: false } },
          ]}
        />
      </div>
    </MagicBellProvider>
  );
}

export default App;