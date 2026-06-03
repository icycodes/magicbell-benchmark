const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { ProjectClient } = require('magicbell/project-client');

const app = express();
app.use(cors());
app.use(express.json());

const RUN_ID = process.env.ZEALT_RUN_ID || 'default';
const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL || '';
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY || '';
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY || '';

const USER_EMAIL = `${MAGICBELL_EMAIL.replace('@gmail.com', '')}+${RUN_ID}@gmail.com`;
const USER_EXTERNAL_ID = `user-${RUN_ID}`;
const BROADCAST_TITLE = `Welcome to MagicBell ${RUN_ID}`;

const projectClient = new ProjectClient({
  apiKey: MAGICBELL_API_KEY,
  apiSecret: MAGICBELL_SECRET_KEY,
});

async function bootstrap() {
  try {
    console.log(`Bootstrapping environment for run-id: ${RUN_ID}`);
    console.log(`User email: ${USER_EMAIL}`);
    console.log(`User external ID: ${USER_EXTERNAL_ID}`);

    // Upsert the user (create handles both create and update)
    await projectClient.users.create({
      email: USER_EMAIL,
      external_id: USER_EXTERNAL_ID,
    });
    console.log(`User upserted: ${USER_EMAIL}`);

    // Send a seed broadcast
    await projectClient.broadcasts.create({
      title: BROADCAST_TITLE,
      recipients: [{ email: USER_EMAIL }],
    });
    console.log(`Broadcast sent: ${BROADCAST_TITLE}`);
  } catch (err) {
    console.error('Bootstrap error:', err.message || err);
  }
}

// GET /token - returns a signed MagicBell User JWT
app.get('/token', (req, res) => {
  try {
    const payload = {
      email: USER_EMAIL,
      external_id: USER_EXTERNAL_ID,
      project_api_key: MAGICBELL_API_KEY,
    };

    const token = jwt.sign(payload, MAGICBELL_SECRET_KEY, {
      algorithm: 'HS256',
    });

    res.json({ token });
  } catch (err) {
    console.error('Token error:', err.message || err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  await bootstrap();
});
