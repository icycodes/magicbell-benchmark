const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  const notificationId = process.argv[2];
  if (!notificationId) {
    console.error('Usage: node index.js <notification_id>');
    process.exit(1);
  }

  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;

  const userEmail = `${magicbellEmail}+${runId}@gmail.com`;

  const token = jwt.sign(
    { user_email: userEmail },
    secretKey,
    { algorithm: 'HS256' }
  );

  const client = new Client({ token });

  await client.notifications.markNotificationRead(notificationId);

  console.log(`Notification ${notificationId} marked as read.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
