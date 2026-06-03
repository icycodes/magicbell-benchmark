'use strict';

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;

// Read environment variables
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;
const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;

if (!MAGICBELL_API_KEY || !MAGICBELL_SECRET_KEY || !MAGICBELL_EMAIL || !ZEALT_RUN_ID) {
  console.error('Missing required environment variables: MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, MAGICBELL_EMAIL, ZEALT_RUN_ID');
  process.exit(1);
}

// Derive user details
const externalId = `user-${ZEALT_RUN_ID}`;
const emailParts = MAGICBELL_EMAIL.split('@');
const userEmail = `${emailParts[0]}+${ZEALT_RUN_ID}@${emailParts[1]}`;

// Project JWT: signed with the API secret, sub=apiKey
// MagicBell project client auth uses a JWT signed with secret key, with sub = api key
const projectToken = jwt.sign({ sub: MAGICBELL_API_KEY }, MAGICBELL_SECRET_KEY, {
  algorithm: 'HS256',
});

app.use(cors());
app.use(express.json());

// GET /token - returns a User JWT signed with the secret key
app.get('/token', (req, res) => {
  const payload = {
    api_key: MAGICBELL_API_KEY,
    user_external_id: externalId,
    user_email: userEmail,
  };

  const token = jwt.sign(payload, MAGICBELL_SECRET_KEY, {
    algorithm: 'HS256',
  });

  res.json({ token });
});

// Initialize: upsert user and send broadcast notification
async function initialize() {
  const { Client } = require('magicbell-js/project-client');

  const client = new Client({ token: projectToken });

  try {
    // Upsert the user
    console.log(`Upserting user: externalId=${externalId}, email=${userEmail}`);
    await client.users.saveUser({
      externalId,
      email: userEmail,
    });
    console.log('User upserted successfully');
  } catch (err) {
    console.error('Failed to upsert user:', err?.message || err);
  }

  try {
    // Send broadcast notification
    const title = `Test Notification ${ZEALT_RUN_ID}`;
    const content = 'This is a test';
    console.log(`Sending broadcast notification: "${title}"`);
    await client.broadcasts.createBroadcast({
      title,
      content,
      recipients: [{ externalId, email: userEmail }],
    });
    console.log('Broadcast notification sent successfully');
  } catch (err) {
    console.error('Failed to send broadcast notification:', err?.message || err);
  }
}

app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  await initialize();
});
