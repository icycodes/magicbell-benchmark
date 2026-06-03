import { useNotifications } from '@magicbell/react-headless';

function CustomBadge() {
  const store = useNotifications();

  if (!store) {
    return <span>Unread count: 0</span>;
  }

  return <span>Unread count: {store.unreadCount}</span>;
}

export default CustomBadge;