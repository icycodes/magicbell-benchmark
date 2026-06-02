import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

const runId = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

if (!runId || !magicbellEmail || !apiKey || !secretKey) {
  console.error('Missing required environment variables:', {
    ZEALT_RUN_ID: !!runId,
    MAGICBELL_EMAIL: !!magicbellEmail,
    MAGICBELL_API_KEY: !!apiKey,
    MAGICBELL_SECRET_KEY: !!secretKey,
  });
}

const [local, domain] = magicbellEmail ? magicbellEmail.split('@') : ['demo', 'example.com'];
const userEmail = `${local}+fi-${runId}@${domain}`;
const userExternalId = `user-fi-${runId}`;

console.log('Derived variables:', {
  userEmail,
  userExternalId,
  runId,
});

// GET /token endpoint
app.get('/token', (req, res) => {
  try {
    const payload = {
      user_email: userEmail,
      user_external_id: userExternalId,
      api_key: apiKey,
    };

    const token = jwt.sign(payload, secretKey, {
      algorithm: 'HS256',
      expiresIn: '1y',
    });

    res.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Bootstrap MagicBell: upsert user and send seed broadcast
async function bootstrapMagicBell() {
  console.log('Bootstrapping MagicBell user and broadcast...');
  const headers = {
    'X-MAGICBELL-API-KEY': apiKey,
    'X-MAGICBELL-API-SECRET': secretKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    // 1. Upsert user
    console.log(`Upserting user: ${userEmail} (external_id: ${userExternalId})`);
    const userResponse = await axios.post(
      'https://api.magicbell.com/users',
      {
        user: {
          external_id: userExternalId,
          email: userEmail,
        },
      },
      { headers }
    );
    console.log('User upserted successfully:', userResponse.data);

    // 2. Send seed broadcast
    const broadcastTitle = `Floating Inbox - ${runId}`;
    console.log(`Sending seed broadcast: "${broadcastTitle}" to external_id: ${userExternalId}`);
    const broadcastResponse = await axios.post(
      'https://api.magicbell.com/broadcasts',
      {
        broadcast: {
          title: broadcastTitle,
          recipients: [
            {
              external_id: userExternalId,
            },
          ],
        },
      },
      { headers }
    );
    console.log('Seed broadcast sent successfully:', broadcastResponse.data);
  } catch (error) {
    console.error('Error bootstrapping MagicBell:', error.response?.data || error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  await bootstrapMagicBell();
});
