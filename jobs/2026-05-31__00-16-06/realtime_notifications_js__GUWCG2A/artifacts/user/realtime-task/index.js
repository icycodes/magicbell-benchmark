const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Realtime } = require('magicbell-js/realtime');
const WebSocket = require('ws');

// Polyfill WebSocket for Node.js
global.WebSocket = WebSocket;

// Read environment variables
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;
const runId = process.env.ZEALT_RUN_ID;

if (!apiKey || !secretKey || !runId) {
  console.error('Missing required environment variables: MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, ZEALT_RUN_ID');
  process.exit(1);
}

// Generate User JWT
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

console.log(`Generated JWT for ${userEmail}`);

// Connect to MagicBell realtime service
const realtime = new Realtime({ token });

const outputPath = path.join(__dirname, 'output.json');

realtime.listen((notification) => {
  console.log('Received notification:', JSON.stringify(notification));

  const output = {
    title: notification.title,
    content: notification.content,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Notification written to ${outputPath}`);
});

console.log('Listening for real-time notifications...');