import { useEffect, useState } from 'react';
import { MagicBellProvider, FloatingInbox } from '@magicbell/react';
import '@magicbell/react/styles/index.css';

export default function Home() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error('Failed to fetch config', err));
  }, []);

  const triggerBroadcast = async () => {
    try {
      const res = await fetch('/api/broadcast', { method: 'POST' });
      const data = await res.json();
      console.log('Broadcast response:', data);
    } catch (err) {
      console.error('Failed to trigger broadcast', err);
    }
  };

  if (!config) {
    return <div>Loading MagicBell config...</div>;
  }

  const tabs = [
    { id: 'unread', title: 'Unread', storeId: 'unread' },
    { id: 'all', title: 'All', storeId: 'default' }
  ];

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>MagicBell Custom Tabs Test</h1>
      <button onClick={triggerBroadcast} style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
        Send Broadcast
      </button>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', border: '1px solid #ccc' }}>
        <MagicBellProvider
          apiKey={config.apiKey}
          userEmail={config.userEmail}
          userKey={config.userJwt}
        >
          <FloatingInbox tabs={tabs} />
        </MagicBellProvider>
      </div>
    </div>
  );
}
