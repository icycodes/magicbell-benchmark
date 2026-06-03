import React, { useState, useEffect } from 'react';
import { MagicBellProvider, FloatingInbox, Inbox } from '@magicbell/react';
import CustomNotificationItem, { TokenContext } from './CustomNotificationItem';

function CustomInbox(props) {
  return <Inbox {...props} ItemComponent={CustomNotificationItem} />;
}

function App() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/token')
      .then((res) => res.json())
      .then((data) => setToken(data.token))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div>Error loading token: {error}</div>;
  }

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <TokenContext.Provider value={token}>
        <MagicBellProvider token={token}>
          <FloatingInbox InboxComponent={CustomInbox} />
        </MagicBellProvider>
      </TokenContext.Provider>
    </div>
  );
}

export default App;
