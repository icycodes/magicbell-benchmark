import { useState, useEffect } from 'react';
import MagicBell, { FloatingNotificationInbox } from '@magicbell/react';

export default function Home() {
  const [jwt, setJwt] = useState('');
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState(null);

  useEffect(() => {
    // Fetch user JWT, email, and apiKey from backend
    fetch('/api/jwt')
      .then((res) => res.json())
      .then((data) => {
        setJwt(data.token);
        setEmail(data.userEmail);
        setApiKey(data.apiKey);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load user auth:', err);
        setLoading(false);
      });
  }, []);

  const triggerBroadcast = async () => {
    setBroadcastLoading(true);
    setBroadcastStatus(null);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastStatus({ success: true, message: 'Broadcast sent successfully!' });
      } else {
        setBroadcastStatus({ success: false, message: data.error || 'Failed to send broadcast' });
      }
    } catch (err) {
      setBroadcastStatus({ success: false, message: err.message });
    } finally {
      setBroadcastLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h2>Loading MagicBell integration...</h2>
      </div>
    );
  }

  // Define custom stores.
  // The 'default' store is configured to match the unread notifications (read: false)
  // This store's count is linked to the global unread count on the bell icon.
  const stores = [
    { id: 'default', defaultQueryParams: { read: false } },
    { id: 'all', defaultQueryParams: {} },
  ];

  // Define custom tabs corresponding to the stores
  const tabs = [
    { storeId: 'default', label: 'Unread' },
    { storeId: 'all', label: 'All' },
  ];

  return (
    <div style={{ padding: '3rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>MagicBell Custom Tabs & Badge Count</h1>
      <p style={{ color: '#666' }}>
        This application integrates MagicBell with custom tabs while keeping the global unread badge count functional.
      </p>

      <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', margin: '2rem 0' }}>
        <h3>User Information</h3>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>JWT Token:</strong> <code style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>{jwt}</code></p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', margin: '2rem 0' }}>
        <div>
          <h3>Notifications Inbox</h3>
          {/* Render the MagicBell FloatingInbox */}
          <MagicBell
            apiKey={apiKey}
            userEmail={email}
            userKey={jwt}
            stores={stores}
            bellCounter="unread"
          >
            {(props) => (
              <FloatingNotificationInbox
                tabs={tabs}
                height={450}
                {...props}
              />
            )}
          </MagicBell>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={triggerBroadcast}
            disabled={broadcastLoading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {broadcastLoading ? 'Sending...' : 'Trigger Broadcast'}
          </button>
        </div>
      </div>

      {broadcastStatus && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '5px',
            background: broadcastStatus.success ? '#e6f4ea' : '#fce8e6',
            color: broadcastStatus.success ? '#137333' : '#c5221f',
            marginTop: '1rem',
          }}
        >
          {broadcastStatus.message}
        </div>
      )}
    </div>
  );
}
