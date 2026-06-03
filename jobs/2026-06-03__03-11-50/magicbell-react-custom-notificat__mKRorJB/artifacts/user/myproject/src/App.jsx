import React, { useEffect, useState } from 'react';
import { MagicBellProvider, FloatingInbox, Inbox } from '@magicbell/react';

const CustomNotificationItem = ({ data }) => {
  console.log('Notification data keys:', Object.keys(data));
  const handleMarkAsRead = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.markAsRead) {
      await data.markAsRead();
    }
  };

  return (
    <div className="custom-notification-item" style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      <div className="custom-notification-title" style={{ fontWeight: 'bold' }}>{data.title}</div>
      <div className="custom-notification-content">{data.content}</div>
      {!data.readAt && (
        <button className="custom-mark-read-btn" onClick={handleMarkAsRead} style={{ marginTop: '5px' }}>
          Mark as Read
        </button>
      )}
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/token')
      .then(res => res.json())
      .then(data => setToken(data.token));
  }, []);

  if (!token) return <div>Loading...</div>;

  const CustomInbox = (props) => <Inbox {...props} ItemComponent={CustomNotificationItem} />;

  return (
    <MagicBellProvider token={token}>
      <div style={{ padding: '20px' }}>
        <FloatingInbox InboxComponent={CustomInbox} />
      </div>
    </MagicBellProvider>
  );
}
