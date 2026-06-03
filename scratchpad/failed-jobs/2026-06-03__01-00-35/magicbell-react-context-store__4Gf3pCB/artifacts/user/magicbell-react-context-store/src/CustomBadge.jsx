import React from 'react';
import { useNotifications } from '@magicbell/react-headless';

export default function CustomBadge() {
  const store = useNotifications();

  if (!store) {
    return <div>Loading...</div>;
  }

  return (
    <div id="custom-badge">
      Unread count: {store.unreadCount !== undefined ? store.unreadCount : 0}
    </div>
  );
}
