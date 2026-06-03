const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { ProjectClient } = require('magicbell-js');

const app = express();
const PORT = 3001;

// Environment variables
const RUN_ID = process.env.ZEALT_RUN_ID || 'default';
const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL;
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;

// Derived user info
const userEmail = `${MAGICBELL_EMAIL}+${RUN_ID}@gmail.com`;
const userExternalId = `user-${RUN_ID}`;

app.use(cors());

// GET /token - Generate and return a MagicBell User JWT
app.get('/token', (req, res) => {
  const payload = {
    email: userEmail,
    external_id: userExternalId,
  };

  const token = jwt.sign(payload, MAGICBELL_SECRET_KEY, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT',
    },
  });

  res.json({ token });
});

// Bootstrap: upsert user and create broadcast on startup
async function bootstrap() {
  try {
    const projectClient = new ProjectClient({
      apiKey: MAGICBELL_API_KEY,
      apiSecret: MAGICBELL_SECRET_KEY,
    });

    // Upsert the user
    console.log(`Upserting user: ${userEmail} (${userExternalId})`);
    await projectClient.users.createOrUpdate({
      external_id: userExternalId,
      email: userEmail,
    });

    // Create a seed broadcast
    const broadcastTitle = `Welcome to MagicBell ${RUN_ID}`;
    console.log(`Creating broadcast: ${broadcastTitle}`);
    await projectClient.broadcasts.create({
      title: broadcastTitle,
      content: 'This is a welcome notification to get you started with MagicBell!',
      category: 'welcome',
      recipients: [
        { external_id: userExternalId },
      ],
    });

    console.log('Bootstrap completed successfully');
  } catch (error) {
    console.error('Bootstrap error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data || JSON.stringify(error.response));
    }
  }
}

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  bootstrap();
});