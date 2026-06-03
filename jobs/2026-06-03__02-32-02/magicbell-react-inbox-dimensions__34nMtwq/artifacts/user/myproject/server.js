import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Client } from 'magicbell-js/project-client';

const app = express();
const PORT = 3001;

// Read environment variables
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;
const MAGICBELL_PROJECT_TOKEN = process.env.MAGICBELL_PROJECT_TOKEN;
const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;

// Derive test user email and external ID
const runId = ZEALT_RUN_ID || 'default';
const [localPart, domain] = (MAGICBELL_EMAIL || 'user@example.com').split('@');
const userEmail = `${localPart}+react-inbox-${runId}@${domain}`;
const userExternalId = `react-inbox-${runId}`;

console.log(`User email: ${userEmail}`);
console.log(`User external ID: ${userExternalId}`);

app.use(cors());
app.use(express.json());

// GET /token — returns a signed User JWT
app.get('/token', (req, res) => {
  const payload = {
    user_email: userEmail,
    user_external_id: userExternalId,
    api_key: MAGICBELL_API_KEY,
  };
  const token = jwt.sign(payload, MAGICBELL_SECRET_KEY, { algorithm: 'HS256' });
  res.json({ token });
});

// Bootstrap MagicBell: upsert user and send a seed broadcast
async function bootstrap() {
  try {
    const client = new Client({ token: MAGICBELL_PROJECT_TOKEN });

    // Upsert the test user
    console.log('Upserting test user...');
    await client.users.saveUser({
      email: userEmail,
      externalId: userExternalId,
    });
    console.log('User upserted successfully.');

    // Send a seed broadcast notification
    console.log('Creating seed broadcast notification...');
    await client.broadcasts.createBroadcast({
      title: 'Welcome to MagicBell!',
      content: 'This is your seed notification from the MagicBell React Inbox demo.',
      recipients: [{ email: userEmail }],
    });
    console.log('Seed broadcast created successfully.');
  } catch (err) {
    console.error('Bootstrap error:', err?.message || err);
  }
}

app.listen(PORT, async () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  await bootstrap();
});
