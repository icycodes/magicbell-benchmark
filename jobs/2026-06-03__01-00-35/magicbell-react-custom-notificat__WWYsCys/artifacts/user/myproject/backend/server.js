const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/project-client');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

const runId = process.env.ZEALT_RUN_ID;
const email = process.env.MAGICBELL_EMAIL;
const [prefix, domain] = email.split('@');
const userEmail = `${prefix}+${runId}@${domain}`;
const externalId = `user-${runId}`;

// Initialize MagicBell Client
const client = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN
});

// GET /token endpoint
app.get('/token', (req, res) => {
  try {
    const payload = {
      user_email: userEmail,
      user_external_id: externalId,
      api_key: process.env.MAGICBELL_API_KEY
    };

    const token = jwt.sign(payload, process.env.MAGICBELL_SECRET_KEY, {
      algorithm: 'HS256'
    });

    console.log(`Generated JWT for ${userEmail}:`, token);
    res.json({ token, jwt: token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Startup logic: upsert user and send broadcast notification
async function startup() {
  try {
    console.log(`Upserting user: ${userEmail} (${externalId})...`);
    const userRes = await client.users.saveUser({
      email: userEmail,
      externalId: externalId
    });
    console.log('User upserted successfully, status:', userRes.metadata.status);

    console.log(`Sending broadcast notification: "Test Notification ${runId}"...`);
    const broadcastRes = await client.broadcasts.createBroadcast({
      title: `Test Notification ${runId}`,
      content: 'This is a test',
      recipients: [
        {
          externalId: externalId,
          email: userEmail
        }
      ]
    });
    console.log('Broadcast notification sent, status:', broadcastRes.metadata.status);
  } catch (error) {
    console.error('Error during startup MagicBell setup:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  await startup();
});
