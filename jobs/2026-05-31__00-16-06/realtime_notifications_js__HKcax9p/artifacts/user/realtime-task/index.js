const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Realtime } = require('magicbell-js/realtime');

const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;
const runId = process.env.ZEALT_RUN_ID;

if (!apiKey || !secretKey || !runId) {
  console.error('Missing required environment variables: MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, ZEALT_RUN_ID');
  process.exit(1);
}

const userEmail = `receiver-${runId}@gmail.com`;

const token = jwt.sign(
  {
    user_email: userEmail,
    api_key: apiKey,
  },
  secretKey,
  {
    algorithm: 'HS256',
  }
);

const outputPath = path.join(__dirname, 'output.json');

const realtime = new Realtime({ token });

realtime.listen(async (notification) => {
  const payload = {
    title: notification.title || '',
    content: notification.content || notification.message || '',
  };

  try {
    await fs.promises.writeFile(outputPath, JSON.stringify(payload, null, 2));
    console.log('Notification written to output.json');
  } catch (error) {
    console.error('Failed to write output.json:', error);
  }
});

process.on('SIGINT', () => {
  realtime.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  realtime.disconnect();
  process.exit(0);
});

setInterval(() => {
  if (!realtime.isListening()) {
    console.warn('Realtime connection is not active. Waiting for reconnect...');
  }
}, 30000);
