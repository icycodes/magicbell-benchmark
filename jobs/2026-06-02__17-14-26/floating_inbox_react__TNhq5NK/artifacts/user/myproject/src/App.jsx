import React, { useEffect, useState } from 'react';
import Provider from '@magicbell/react/context-provider';
import FloatingInbox from '@magicbell/react/floating-inbox';
import '@magicbell/react/styles/floating-inbox.css';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/token')
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          setToken(data.token);
        }
      })
      .catch((err) => console.error('Error fetching token:', err));
  }, []);

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <Provider token={token}>
      <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <FloatingInbox />
      </header>
      <main style={{ padding: '2rem' }}>
        <h1>Welcome to the Dashboard</h1>
      </main>
    </Provider>
  );
}

export default App;
