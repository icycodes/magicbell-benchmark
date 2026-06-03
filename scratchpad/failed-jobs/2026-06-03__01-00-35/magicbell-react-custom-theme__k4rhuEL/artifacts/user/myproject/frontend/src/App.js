import React, { useEffect, useState } from 'react';
import Provider from '@magicbell/react/context-provider';
import FloatingInbox from '@magicbell/react/floating-inbox';
import '@magicbell/react/styles/index.css';
import './App.css';

function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/token')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setToken(data.token);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching token:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>MagicBell Custom Theme Inbox</h1>
        <p>Your floating notification inbox is rendered below.</p>
        {loading && <div className="loading">Loading notifications...</div>}
        {error && <div className="error">Error: {error}</div>}
        {token && (
          <Provider token={token}>
            <FloatingInbox
              placement="bottom-end"
              height={600}
              width={500}
              offset={20}
            />
          </Provider>
        )}
      </header>
    </div>
  );
}

export default App;
