import { MagicBellProvider } from '@magicbell/react-headless';
import CustomBadge from './CustomBadge';

const MAGICBELL_API_KEY = import.meta.env.VITE_MAGICBELL_API_KEY;
const MAGICBELL_EMAIL = import.meta.env.VITE_MAGICBELL_EMAIL;

function App() {
  return (
    <MagicBellProvider apiKey={MAGICBELL_API_KEY} userEmail={MAGICBELL_EMAIL}>
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>MagicBell Custom Badge</h1>
        <CustomBadge />
      </div>
    </MagicBellProvider>
  );
}

export default App;