const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/project-client');

const app = express();
app.use(cors());

const PORT = 3001;
const runId = process.env.ZEALT_RUN_ID || 'local';
const rawEmail = process.env.MAGICBELL_EMAIL || 'test@example.com';
const [emailPrefix, emailDomain] = rawEmail.split('@');
const email = `${emailPrefix}+${runId}@${emailDomain}`;
const externalId = `user-${runId}`;

const magicbellClient = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN,
});

async function init() {
  try {
    // Upsert user
    console.log(`Upserting user ${externalId} with email ${email}`);
    await magicbellClient.users.saveUser({
      externalId: externalId,
      email: email,
    });
    console.log('User created/upserted');

    // Send broadcast
    console.log(`Sending broadcast to user ${externalId}`);
    await magicbellClient.broadcasts.createBroadcast({
      title: `Test Notification ${runId}`,
      content: 'This is a test',
      recipients: [{ externalId: externalId }]
    });
    console.log('Broadcast sent');

  } catch (err) {
    console.error('Error during init:', err);
  }
}

app.get('/token', (req, res) => {
  const token = jwt.sign(
    { external_id: externalId },
    process.env.MAGICBELL_SECRET_KEY,
    { expiresIn: '1h' }
  );
  res.json({ token, externalId, email });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  init();
});
