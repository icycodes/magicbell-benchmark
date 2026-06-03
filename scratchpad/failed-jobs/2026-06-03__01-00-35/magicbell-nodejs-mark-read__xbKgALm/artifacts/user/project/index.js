const jwt = require('jsonwebtoken');
const { Client: UserClient } = require('magicbell-js/user-client');

async function main() {
  const notificationId = process.argv[2];
  if (!notificationId) {
    console.error('Please provide a notification ID as a command-line argument.');
    process.exit(1);
  }

  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const email = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;

  if (!apiKey || !secretKey || !email || !runId) {
    console.error('Missing environment variables. Please ensure MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, MAGICBELL_EMAIL, and ZEALT_RUN_ID are set.');
    process.exit(1);
  }

  // Handle case where MAGICBELL_EMAIL is a full email or just the local part
  let userEmail;
  if (email.includes('@')) {
    const [local, domain] = email.split('@');
    userEmail = `${local}+${runId}@${domain}`;
  } else {
    userEmail = `${email}+${runId}@gmail.com`;
  }

  const payload = {
    user_email: userEmail,
    api_key: apiKey,
  };

  const token = jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    expiresIn: '1y',
  });

  const userClient = new UserClient({
    token: token,
  });

  try {
    await userClient.notifications.markNotificationRead(notificationId);
    console.log(`Notification ${notificationId} marked as read.`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    process.exit(1);
  }
}

main();
