const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/project-client');
require('dotenv').config();

const app = express();
app.use(cors());

const port = 3001;

const runId = process.env.ZEALT_RUN_ID || 'default-run-id';
const magicbellEmail = process.env.MAGICBELL_EMAIL || 'test';
const userEmail = `${magicbellEmail}+${runId}@gmail.com`;
const userExternalId = `user-${runId}`;

const magicbellApiKey = process.env.MAGICBELL_API_KEY || 'default-api-key';
const magicbellApiSecret = process.env.MAGICBELL_API_SECRET || 'default-secret-key';

// Initialize magicbell-js ProjectClient
// We pass the secret key as the token, or a dummy JWT if it requires one.
const dummyJwt = jwt.sign({ api_key: magicbellApiKey }, magicbellApiSecret, { algorithm: 'HS256' });

const magicbell = new Client({
  token: dummyJwt,
});

async function bootstrap() {
  try {
    await magicbell.users.saveUser({
      externalId: userExternalId,
      email: userEmail,
      firstName: `User ${runId}`,
    });

    await magicbell.broadcasts.createBroadcast({
      title: `Welcome to MagicBell ${runId}`,
      recipients: [{ externalId: userExternalId }],
    });
    
    console.log('Bootstrap completed successfully.');
  } catch (error) {
    console.error('Error during bootstrap:', error.message || error);
  }
}

app.get('/token', (req, res) => {
  const payload = {
    user_external_id: userExternalId,
    user_email: userEmail,
    api_key: magicbellApiKey,
  };

  const token = jwt.sign(payload, magicbellApiSecret, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });

  res.json({ token });
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
  bootstrap();
});
