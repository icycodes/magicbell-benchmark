import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client as ProjectClient } from 'magicbell-js/project-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Environment variables
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;
const MAGICBELL_PROJECT_TOKEN = process.env.MAGICBELL_PROJECT_TOKEN;
const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;

// Construct user email with run-id
function getUserEmail() {
  if (!MAGICBELL_EMAIL || !ZEALT_RUN_ID) {
    throw new Error('MAGICBELL_EMAIL and ZEALT_RUN_ID environment variables are required');
  }
  const atIndex = MAGICBELL_EMAIL.indexOf('@');
  if (atIndex === -1) {
    throw new Error('Invalid MAGICBELL_EMAIL format');
  }
  const localPart = MAGICBELL_EMAIL.substring(0, atIndex);
  const domainPart = MAGICBELL_EMAIL.substring(atIndex);
  return `${localPart}+${ZEALT_RUN_ID}${domainPart}`;
}

// Generate User JWT for MagicBell
function generateUserJWT(userEmail) {
  const payload = {
    email: userEmail,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
  };
  return jwt.sign(payload, MAGICBELL_SECRET_KEY, { algorithm: 'HS256' });
}

// GET /api/config - Provide frontend with MagicBell configuration
app.get('/api/config', (req, res) => {
  try {
    const userEmail = getUserEmail();
    const userKey = generateUserJWT(userEmail);
    res.json({
      apiKey: MAGICBELL_API_KEY,
      userEmail,
      userKey,
    });
  } catch (err) {
    console.error('Config error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/broadcast - Send a broadcast notification
app.post('/api/broadcast', async (req, res) => {
  try {
    const userEmail = getUserEmail();
    
    // Use the project token for authentication with the MagicBell API
    const client = new ProjectClient({
      token: MAGICBELL_SECRET_KEY,
    });

    const result = await client.broadcasts.createBroadcast({
      title: 'New Notification',
      content: 'You have a new notification!',
      recipients: [{ email: userEmail }],
    });

    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: err.message, details: err.toString() });
  }
});

// Catch-all: serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});