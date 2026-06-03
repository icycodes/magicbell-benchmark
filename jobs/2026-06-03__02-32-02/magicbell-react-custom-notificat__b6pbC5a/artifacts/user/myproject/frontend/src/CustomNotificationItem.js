import React, { useState, useCallback } from 'react';

const MAGICBELL_API_BASE = 'https://api.magicbell.com/v2';

// Token will be injected via context
export const TokenContext = React.createContext(null);

function CustomNotificationItem({ data, index, onNotificationClick }) {
  const token = React.useContext(TokenContext);
  const [isRead, setIsRead] = useState(() => Boolean(data.readAt));

  const handleMarkRead = useCallback(
    async (e) => {
      e.stopPropagation();
      try {
        await fetch(`${MAGICBELL_API_BASE}/notifications/${data.id}/read`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        setIsRead(true);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    [data.id, token]
  );

  return (
    <div className="custom-notification-item">
      <div className="custom-notification-title">{data.title}</div>
      {data.content && (
        <div className="custom-notification-content">{data.content}</div>
      )}
      {!isRead && (
        <button
          className="custom-mark-read-btn"
          onClick={handleMarkRead}
          type="button"
        >
          Mark as read
        </button>
      )}
    </div>
  );
}

export default CustomNotificationItem;
