const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

const notificationId = process.argv[2];

if (!notificationId) {
  console.error('Usage: node index.js <notification_id>');
  process.exit(1);
}

const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;
const email = process.env.MAGICBELL_EMAIL;
const runId = process.env.ZEALT_RUN_ID;

if (!apiKey || !secretKey || !email || !runId) {
  console.error('Missing required environment variables: MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, MAGICBELL_EMAIL, ZEALT_RUN_ID');
  process.exit(1);
}

const userEmail = `${email}+${runId}@gmail.com`;

const token = jwt.sign({ user_email: userEmail }, secretKey, {
  algorithm: 'HS256',
  header: { alg: 'HS256', typ: 'JWT' },
});

const client = new Client({ token });

client.notifications
  .markNotificationRead(notificationId)
  .then(() => {
    console.log(`Notification ${notificationId} marked as read.`);
  })
  .catch((err) => {
    console.error('Failed to mark notification as read:', err.message);
    process.exit(1);
  });