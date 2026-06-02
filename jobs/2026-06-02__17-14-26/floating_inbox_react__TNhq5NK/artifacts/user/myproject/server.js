const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());

const PORT = 3001;

const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL || 'test@example.com';
const MAGICBELL_PROJECT_TOKEN = process.env.MAGICBELL_PROJECT_TOKEN;
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID || 'local';

const [localPart, domainPart] = MAGICBELL_EMAIL.split('@');
const userEmail = `${localPart}+fi-${ZEALT_RUN_ID}@${domainPart}`;
const userExternalId = `user-fi-${ZEALT_RUN_ID}`;
const broadcastTitle = `Floating Inbox - ${ZEALT_RUN_ID}`;

async function setupMagicBell() {
  try {
    // Upsert User
    const userRes = await fetch('https://api.magicbell.com/users', {
      method: 'POST',
      headers: {
        'X-MAGICBELL-API-KEY': MAGICBELL_API_KEY,
        'X-MAGICBELL-API-SECRET': MAGICBELL_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: {
          external_id: userExternalId,
          email: userEmail,
          first_name: 'Demo',
          last_name: 'User'
        }
      })
    });
    const userData = await userRes.json();
    console.log('User upsert:', userData);

    // Send Broadcast
    const broadcastRes = await fetch('https://api.magicbell.com/broadcasts', {
      method: 'POST',
      headers: {
        'X-MAGICBELL-API-KEY': MAGICBELL_API_KEY,
        'X-MAGICBELL-API-SECRET': MAGICBELL_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        broadcast: {
          title: broadcastTitle,
          recipients: [{ external_id: userExternalId }]
        }
      })
    });
    const broadcastData = await broadcastRes.json();
    console.log('Broadcast sent:', broadcastData);
  } catch (err) {
    console.error('Error setting up MagicBell:', err);
  }
}

app.get('/token', (req, res) => {
  const token = jwt.sign(
    {
      user_email: userEmail,
      user_external_id: userExternalId,
      api_key: MAGICBELL_API_KEY
    },
    MAGICBELL_SECRET_KEY,
    { expiresIn: '1y', algorithm: 'HS256' }
  );

  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  setupMagicBell();
});
