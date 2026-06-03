import React, { useEffect, useState } from 'react';
import { MagicBellProvider, FloatingInbox } from '@magicbell/react';

function App() {
  const [authData, setAuthData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/token')
      .then(res => res.json())
      .then(data => {
        setAuthData(data);
      })
      .catch(err => console.error('Error fetching token:', err));
  }, []);

  if (!authData) {
    return <div>Loading MagicBell...</div>;
  }

  return (
    <MagicBellProvider
      apiKey={authData.apiKey}
      userEmail={authData.userEmail}
      userExternalId={authData.userExternalId}
      userKey={authData.token}
    >
      <div style={{ padding: '50px' }}>
        <h1>MagicBell React Inbox</h1>
        <FloatingInbox height={500} width={400} />
      </div>
    </MagicBellProvider>
  );
}

export default App;