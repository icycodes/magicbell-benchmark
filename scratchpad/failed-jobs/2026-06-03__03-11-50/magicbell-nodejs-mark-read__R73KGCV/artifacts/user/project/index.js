const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  const notificationId = process.argv[2];

  if (!notificationId) {
    console.error('Please provide a notification ID as an argument.');
    process.exit(1);
  }

  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;

  if (!apiKey || !secretKey || !magicbellEmail || !runId) {
    console.error('Missing required environment variables.');
    process.exit(1);
  }

  // Handle cases where MAGICBELL_EMAIL might already contain a domain
  const emailPrefix = magicbellEmail.split('@')[0];
  
  // As per instructions, format is ${MAGICBELL_EMAIL}+${run-id}@gmail.com
  // We use emailPrefix to ensure it's a valid email if MAGICBELL_EMAIL had a domain
  let userEmail;
  if (magicbellEmail.includes('@')) {
    userEmail = `${emailPrefix}+${runId}@gmail.com`;
  } else {
    userEmail = `${magicbellEmail}+${runId}@gmail.com`;
  }

  const payload = {
    user_email: userEmail,
    api_key: apiKey,
  };

  const userToken = jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });

  const client = new Client({
    token: userToken,
  });

  try {
    await client.notifications.markNotificationRead(notificationId);
    console.log(`Notification ${notificationId} marked as read.`);
  } catch (error) {
    console.error('Failed to mark notification as read:', error.message || error);
    process.exit(1);
  }
}

main();
