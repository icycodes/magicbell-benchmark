const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

const notificationId = process.argv[2];
if (!notificationId) {
  console.error('Usage: node fetch.js <notification_id>');
  process.exit(1);
}

const runId = process.env.ZEALT_RUN_ID;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

const payload = {
  external_id: `user_${runId}`,
  user_email: `${process.env.MAGICBELL_EMAIL}+user_${runId}@gmail.com`,
  api_key: apiKey,
};

const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

const client = new Client({ token });

client.notifications.fetchNotification(notificationId).then((notification) => {
  console.log(`Title: ${notification.title}`);
}).catch((err) => {
  console.error('Error fetching notification:', err.message);
  process.exit(1);
});
