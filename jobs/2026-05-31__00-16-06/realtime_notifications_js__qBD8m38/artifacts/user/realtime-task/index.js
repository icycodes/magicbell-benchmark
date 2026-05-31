const { Realtime } = require('magicbell-js/realtime');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;
const runId = process.env.ZEALT_RUN_ID;

if (!apiKey || !secretKey || !runId) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const userEmail = `receiver-${runId}@gmail.com`;

const payload = {
  user_email: userEmail,
  api_key: apiKey
};

const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

console.log("Generated JWT Token:", token);

const realtime = new Realtime({ token });

realtime.listen((notification) => {
  console.log("Received notification:", notification);
  
  const outputFilePath = path.join(__dirname, 'output.json');
  const outputData = {
    title: notification.title,
    content: notification.content
  };
  
  fs.writeFileSync(outputFilePath, JSON.stringify(outputData, null, 2), 'utf8');
  console.log("Written to output.json");
});

console.log("Listening for notifications...");

process.on('uncaughtException', (err) => {
  console.error("Uncaught exception:", err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
});
