import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Client } from 'magicbell-js/project-client';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Environment variables
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_PROJECT_TOKEN = process.env.MAGICBELL_PROJECT_TOKEN;
const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;

// Derive the test user's email and external ID
const runId = ZEALT_RUN_ID || 'default';
const emailParts = MAGICBELL_EMAIL ? MAGICBELL_EMAIL.split('@') : ['test', 'example.com'];
const userEmail = `${emailParts[0]}+react-inbox-${runId}@${emailParts.slice(1).join('@')}`;
const userExternalId = `react-inbox-${runId}`;

// Generate User JWT for the frontend
function generateUserToken() {
  const payload = {
    user_email: userEmail,
    user_external_id: userExternalId,
    api_key: MAGICBELL_API_KEY,
  };

  const token = jwt.sign(payload, MAGICBELL_SECRET_KEY, {
    algorithm: 'HS256',
  });

  return token;
}

// Token endpoint
app.get('/token', (req, res) => {
  const token = generateUserToken();
  res.json({ token });
});

// Bootstrap MagicBell on startup
async function bootstrap() {
  try {
    const client = new Client({
      token: MAGICBELL_PROJECT_TOKEN,
    });

    // Upsert the test user
    console.log(`Upserting user: ${userEmail} (${userExternalId})`);
    const userResponse = await client.users.saveUser({
      email: userEmail,
      externalId: userExternalId,
    });
    console.log('User upserted:', JSON.stringify(userResponse.data));

    // Create a broadcast notification for the user
    console.log('Creating broadcast notification...');
    const broadcastResponse = await client.broadcasts.createBroadcast({
      title: 'Welcome to MagicBell!',
      content: 'This is a seed notification to get you started with your inbox.',
      recipients: [
        {
          email: userEmail,
          externalId: userExternalId,
        },
      ],
    });
    console.log('Broadcast created:', JSON.stringify(broadcastResponse.data));
  } catch (error) {
    console.error('Bootstrap error:', error.message || error);
    if (error.metadata) {
      console.error('Status:', error.metadata.status);
      try {
        const raw = error.raw;
        if (raw) {
          const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
          console.error('Response:', text);
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  bootstrap();
});