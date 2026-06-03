const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

// Read environment variables
const runId = process.env.ZEALT_RUN_ID;
const email = process.env.MAGICBELL_EMAIL;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

if (!runId || !email || !apiKey || !secretKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Read notification ID from command line arguments
const notificationId = process.argv[2];
if (!notificationId) {
  console.error('Please provide a notification ID');
  process.exit(1);
}

// Generate MagicBell User JWT
const emailLocalPart = email.includes('@') ? email.split('@')[0] : email;
const payload = {
  external_id: `user_${runId}`,
  user_email: `${emailLocalPart}+user_${runId}@gmail.com`,
  api_key: apiKey
};

const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

// Initialize MagicBell UserClient Client
const client = new Client({
  token: token
});

async function main() {
  try {
    const response = await client.notifications.fetchNotification(notificationId);
    if (response && response.data) {
      console.log(`Title: ${response.data.title}`);
    } else {
      console.error('Notification not found or empty response');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error fetching notification:', error.message || error);
    process.exit(1);
  }
}

main();
