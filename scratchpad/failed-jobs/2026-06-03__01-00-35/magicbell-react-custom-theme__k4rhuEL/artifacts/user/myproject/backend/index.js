const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/project-client');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const runId = process.env.ZEALT_RUN_ID || '';
const magicbellEmail = process.env.MAGICBELL_EMAIL || '';
const apiKey = process.env.MAGICBELL_API_KEY || '';
const secretKey = process.env.MAGICBELL_SECRET_KEY || '';
const projectToken = process.env.MAGICBELL_PROJECT_TOKEN || '';

const email = magicbellEmail.includes('@')
  ? `${magicbellEmail.split('@')[0]}+${runId}@gmail.com`
  : `${magicbellEmail}+${runId}@gmail.com`;

const externalId = `user-${runId}`;

// Bootstrap function to upsert user and send seed broadcast
async function bootstrap() {
  console.log('Starting MagicBell bootstrap process...');
  try {
    const client = new Client({
      token: projectToken
    });

    console.log(`Upserting user: ${email} (ID: ${externalId})`);
    await client.users.saveUser({
      email: email,
      externalId: externalId
    });
    console.log('User upserted successfully.');

    console.log(`Sending seed broadcast: "Welcome to MagicBell ${runId}"`);
    await client.broadcasts.createBroadcast({
      title: `Welcome to MagicBell ${runId}`,
      recipients: [
        {
          email: email,
          externalId: externalId
        }
      ],
      content: `Welcome to MagicBell ${runId}`
    });
    console.log('Seed broadcast created successfully.');
  } catch (err) {
    console.error('Error during bootstrapping:', err.message, err.response ? err.response.data : '');
  }
}

// GET /token endpoint
app.get('/token', (req, res) => {
  try {
    const payload = {
      user_email: email,
      user_external_id: externalId,
      api_key: apiKey
    };

    const token = jwt.sign(payload, secretKey, {
      algorithm: 'HS256'
    });

    res.status(200).json({ token });
  } catch (err) {
    console.error('Error generating token:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  await bootstrap();
});
