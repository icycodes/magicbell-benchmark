import React from 'react';
import { MagicBellProvider } from '@magicbell/react-headless';
import CustomBadge from './CustomBadge';

const apiKey = import.meta.env.VITE_MAGICBELL_API_KEY;
const userEmail = import.meta.env.VITE_MAGICBELL_EMAIL;
const userKey = import.meta.env.VITE_MAGICBELL_USER_KEY;

function App() {
  return (
    <MagicBellProvider apiKey={apiKey} userEmail={userEmail} userKey={userKey}>
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>MagicBell Custom Badge Demo</h1>
        <CustomBadge />
      </div>
    </MagicBellProvider>
  );
}

export default App;
