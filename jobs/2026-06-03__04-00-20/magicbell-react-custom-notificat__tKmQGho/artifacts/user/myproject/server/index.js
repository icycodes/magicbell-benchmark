const express = require('express');
const jwt = require('jsonwebtoken');
const { createProjectClient } = require('magicbell-js/project-client');

const app = express();
const PORT = 3001;

const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID || '1';
const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL || 'test@example.com';
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY || '';
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY || '';

// Derive the email with plus format
const emailParts = MAGICBELL_EMAIL.split('@');
const emailPrefix = emailParts[0];
const emailDomain = emailParts[1];
const derivedEmail = `${emailPrefix}+${ZEALT_RUN_ID}@${emailDomain}`;

const externalId = `user-${ZEALT_RUN_ID}`;

// Create MagicBell project client
const magicbellClient = createProjectClient({
  apiKey: MAGICBELL_API_KEY,
  apiSecret: MAGICBELL_API_KEY ? undefined : undefined,
  projectSecret: MAGICBELL_SECRET_KEY,
});

// Upsert user and send broadcast on startup
async function initialize() {
  try {
    console.log('Upserting user with external_id:', externalId, 'and email:', derivedEmail);

    // Upsert the user using the project client
    await magicbellClient.users.upsert({
      external_id: externalId,
      email: derivedEmail,
    });

    console.log('User upserted successfully');

    // Send a broadcast notification
    console.log('Sending broadcast notification...');
    await magicbellClient.broadcasts.create({
      title: `Test Notification ${ZEALT_RUN_ID}`,
      content: 'This is a test',
      recipients: [{ external_id: externalId }],
    });

    console.log('Broadcast notification sent successfully');
  } catch (err) {
    console.error('Initialization error:', err.message);
    console.error('Full error:', err);
  }
}

// GET /token endpoint - returns User JWT
app.get('/token', (req, res) => {
  const payload = {
    external_id: externalId,
    email: derivedEmail,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, MAGICBELL_SECRET_KEY, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });

  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initialize();
});