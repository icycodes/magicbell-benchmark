import { useEffect, useState } from 'react';
import Provider from '@magicbell/react/context-provider';
import FloatingInbox from '@magicbell/react/floating-inbox';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/token')
      .then((res) => res.json())
      .then((data) => {
        setToken(data.token);
      })
      .catch((err) => {
        console.error('Failed to fetch token:', err);
      });
  }, []);

  if (!token) {
    return <div>Loading MagicBell...</div>;
  }

  return (
    <Provider token={token}>
      <div style={{ padding: '20px' }}>
        <h1>MagicBell Custom Theme Inbox</h1>
        <FloatingInbox 
          placement="bottom-end"
          height={600}
          width={500}
          offset={20}
        />
      </div>
    </Provider>
  );
}

export default App;
