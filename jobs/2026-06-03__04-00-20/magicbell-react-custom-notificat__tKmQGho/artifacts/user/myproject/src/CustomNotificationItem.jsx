import React from 'react';

function CustomNotificationItem({ notification }) {
  const handleMarkRead = async (e) => {
    e.stopPropagation();
    try {
      await notification.markAsRead();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div className="custom-notification-item">
      <div className="custom-notification-title">
        {notification.title}
      </div>
      <div className="custom-notification-content">
        {notification.content}
      </div>
      {!notification.readAt && (
        <button className="custom-mark-read-btn" onClick={handleMarkRead}>
          Mark as read
        </button>
      )}
    </div>
  );
}

export default CustomNotificationItem;