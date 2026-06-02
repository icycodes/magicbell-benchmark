import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

// Read credentials from environment
const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL;
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;

if (!MAGICBELL_EMAIL || !MAGICBELL_API_KEY || !MAGICBELL_SECRET_KEY || !ZEALT_RUN_ID) {
  console.error('Missing required environment variables: MAGICBELL_EMAIL, MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, ZEALT_RUN_ID');
  process.exit(1);
}

// Derive user identifiers
const [localPart, domain] = MAGICBELL_EMAIL.split('@');
const userEmail = `${localPart}+fi-${ZEALT_RUN_ID}@${domain}`;
const userExternalId = `user-fi-${ZEALT_RUN_ID}`;
const broadcastTitle = `Floating Inbox - ${ZEALT_RUN_ID}`;

const MAGICBELL_API_BASE = 'https://api.magicbell.com';

const commonHeaders = {
  'Content-Type': 'application/json',
  'X-MAGICBELL-API-KEY': MAGICBELL_API_KEY,
  'X-MAGICBELL-API-SECRET': MAGICBELL_SECRET_KEY,
};

async function upsertUser() {
  console.log(`Upserting MagicBell user: ${userEmail} (external_id: ${userExternalId})`);

  const res = await fetch(`${MAGICBELL_API_BASE}/users`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify({
      user: {
        email: userEmail,
        external_id: userExternalId,
      },
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    console.error('Failed to upsert user:', JSON.stringify(body));
    throw new Error(`Failed to upsert user: ${res.status}`);
  }
  console.log('User upserted successfully:', JSON.stringify(body));
  return body;
}

async function sendSeedBroadcast() {
  console.log(`Sending seed broadcast: "${broadcastTitle}"`);

  const res = await fetch(`${MAGICBELL_API_BASE}/broadcasts`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify({
      broadcast: {
        title: broadcastTitle,
        content: `Welcome to the MagicBell Floating Inbox demo! Run ID: ${ZEALT_RUN_ID}`,
        recipients: [
          { external_id: userExternalId },
        ],
      },
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    console.error('Failed to send broadcast:', JSON.stringify(body));
    throw new Error(`Failed to send broadcast: ${res.status}`);
  }
  console.log('Broadcast sent successfully:', JSON.stringify(body));
  return body;
}

// GET /token – mint a per-user HS256 JWT
app.get('/token', (req, res) => {
  const payload = {
    user_email: userEmail,
    user_external_id: userExternalId,
    api_key: MAGICBELL_API_KEY,
  };

  const token = jwt.sign(payload, MAGICBELL_SECRET_KEY, {
    algorithm: 'HS256',
    expiresIn: '1y',
  });

  res.json({ token });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', userEmail, userExternalId });
});

const PORT = 3001;

async function bootstrap() {
  try {
    await upsertUser();
    await sendSeedBroadcast();
  } catch (err) {
    console.error('Bootstrap error:', err.message);
    // Continue even if bootstrap fails – the server should still start
  }

  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
    console.log(`  /token  -> HS256 JWT for ${userEmail}`);
    console.log(`  User external_id: ${userExternalId}`);
    console.log(`  Broadcast title: "${broadcastTitle}"`);
  });
}

bootstrap();
