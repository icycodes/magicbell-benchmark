import { MagicBellProvider, useNotifications } from '@magicbell/react-headless';

function CustomBadge() {
  const store = useNotifications();

  if (!store) {
    return <div>Loading...</div>;
  }

  return <div>Unread count: {store.unreadCount}</div>;
}

function App() {
  const apiKey = import.meta.env.VITE_MAGICBELL_API_KEY;
  const userEmail = import.meta.env.VITE_MAGICBELL_EMAIL;

  return (
    <MagicBellProvider apiKey={apiKey} userEmail={userEmail}>
      <CustomBadge />
    </MagicBellProvider>
  );
}

export default App;
