const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/project-client');

const app = express();
app.use(cors());
app.use(express.json());

const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_PROJECT_TOKEN = process.env.MAGICBELL_PROJECT_TOKEN;

if (!MAGICBELL_EMAIL || !ZEALT_RUN_ID || !MAGICBELL_SECRET_KEY || !MAGICBELL_API_KEY || !MAGICBELL_PROJECT_TOKEN) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const [local, domain] = MAGICBELL_EMAIL.split('@');
const testUserEmail = `${local}+react-inbox-${ZEALT_RUN_ID}@${domain}`;
const testUserExternalId = `react-inbox-${ZEALT_RUN_ID}`;

// Endpoint to generate User JWT
app.get('/token', (req, res) => {
  try {
    const payload = {
      user_email: testUserEmail,
      user_external_id: testUserExternalId,
      api_key: MAGICBELL_API_KEY
    };
    const token = jwt.sign(payload, MAGICBELL_SECRET_KEY, { algorithm: 'HS256' });
    res.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

const PORT = 3001;

async function bootstrap() {
  console.log('Bootstrapping MagicBell state...');
  try {
    const magicbellClient = new Client({
      token: MAGICBELL_PROJECT_TOKEN
    });

    console.log(`Upserting user: ${testUserEmail} (${testUserExternalId})`);
    await magicbellClient.users.saveUser({
      email: testUserEmail,
      externalId: testUserExternalId
    });
    console.log('User upserted successfully.');

    console.log('Sending seed broadcast notification...');
    await magicbellClient.broadcasts.createBroadcast({
      title: 'Welcome to your MagicBell Inbox!',
      content: 'This is a seed notification to ensure your inbox is not empty.',
      recipients: [
        {
          email: testUserEmail,
          externalId: testUserExternalId
        }
      ]
    });
    console.log('Seed broadcast notification sent successfully.');
  } catch (error) {
    console.error('Error bootstrapping MagicBell:', error);
  }
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  bootstrap();
});
