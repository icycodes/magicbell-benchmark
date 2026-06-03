import React, { useState, useEffect, useContext } from 'react';
import Provider from '@magicbell/react/context-provider';
import FloatingInbox from '@magicbell/react/floating-inbox';
import Inbox from '@magicbell/react/inbox';
import MagicBellContext from '@magicbell/react/internal/context/magicbell.context';

import '@magicbell/react/styles/floating-inbox.css';
import '@magicbell/react/styles/inbox.css';

// Custom Notification Item component
function CustomNotificationItem({ data }) {
  const ctx = useContext(MagicBellContext);

  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    try {
      if (ctx && ctx.notifications) {
        console.log(`Marking notification ${data.id} as read...`);
        await ctx.notifications.markAsRead(data.id);
        console.log(`Notification ${data.id} successfully marked as read.`);
      } else {
        console.warn('MagicBellContext or notifications store not available.');
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const isUnread = !data.readAt;

  return (
    <div 
      className="custom-notification-item" 
      style={{ 
        padding: '16px', 
        borderBottom: '1px solid #eaeaea',
        backgroundColor: isUnread ? '#f9f9f9' : '#ffffff',
        fontFamily: 'sans-serif'
      }}
    >
      <div 
        className="custom-notification-title" 
        style={{ 
          fontSize: '15px', 
          fontWeight: isUnread ? 'bold' : 'normal',
          color: '#333333'
        }}
      >
        {data.title}
      </div>
      <div 
        className="custom-notification-content" 
        style={{ 
          fontSize: '13px', 
          color: '#666666',
          marginTop: '6px'
        }}
      >
        {data.content}
      </div>
      {isUnread && (
        <button 
          className="custom-mark-read-btn" 
          onClick={handleMarkAsRead}
          style={{ 
            marginTop: '10px', 
            padding: '6px 12px', 
            backgroundColor: '#007bff', 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          Mark as Read
        </button>
      )}
    </div>
  );
}

// Wrapper to pass the Custom Notification Item to Inbox
function CustomNotification(props) {
  return <Inbox {...props} ItemComponent={CustomNotificationItem} />;
}

function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let retryTimeout = null;

    const fetchToken = async () => {
      try {
        console.log('Fetching user JWT from backend...');
        const response = await fetch('http://localhost:3001/token');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (active) {
          setToken(data.token);
          setLoading(false);
          console.log('Successfully fetched user JWT.');
        }
      } catch (err) {
        console.error('Error fetching token, retrying in 2 seconds...', err);
        if (active) {
          setError('Waiting for backend to start...');
          retryTimeout = setTimeout(fetchToken, 2000);
        }
      }
    };

    fetchToken();

    return () => {
      active = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h3>Loading MagicBell Inbox...</h3>
        {error && <p style={{ color: '#888' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1>My MagicBell Custom Inbox</h1>
      </header>
      <main>
        <Provider token={token}>
          <div style={{ display: 'inline-block' }}>
            <FloatingInbox 
              defaultOpen={true} 
              InboxComponent={CustomNotification} 
              width={450}
              height={500}
            />
          </div>
        </Provider>
      </main>
    </div>
  );
}

export default App;
