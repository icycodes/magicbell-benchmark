import { useNotifications } from '@magicbell/react-headless';

function CustomBadge() {
  const store = useNotifications();

  const unreadCount = store ? store.unreadCount : 0;

  return (
    <div className="custom-badge">
      <span>Unread count: {unreadCount}</span>
    </div>
  );
}

export default CustomBadge;
