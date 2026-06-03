const { Client: ProjectClient } = require('magicbell-js/project-client');
const { Client: UserClient } = require('magicbell-js/user-client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function main() {
  // Construct the target user email
  // MAGICBELL_EMAIL is the full email (e.g., REDACTED@gmail.com)
  // We extract the local part and construct: localPart+ZEALT_RUN_ID@gmail.com
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const zealtRunId = process.env.ZEALT_RUN_ID;
  const localPart = magicbellEmail.split('@')[0];
  const userEmail = `${localPart}+${zealtRunId}@gmail.com`;

  console.log('Target user email:', userEmail);

  // Step 1: Initialize ProjectClient and create a broadcast
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const projectClient = new ProjectClient({ token: projectToken });

  console.log('Creating broadcast...');
  const broadcastResponse = await projectClient.broadcasts.createBroadcast({
    title: 'Test Notification',
    content: 'This is a test notification for archiving.',
    recipients: [{ email: userEmail }],
  });

  console.log('Broadcast created:', JSON.stringify(broadcastResponse.data, null, 2));

  // Wait for the notification to be delivered
  console.log('Waiting for notification to be delivered...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Step 2: Generate a User JWT
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  const userJwt = jwt.sign(
    {
      user_email: userEmail,
      api_key: apiKey,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    },
    secretKey,
    { algorithm: 'HS256' }
  );

  console.log('User JWT generated');

  // Step 3: Initialize UserClient with the User JWT
  const userClient = new UserClient({ token: userJwt });

  // Step 4: Fetch the user's notifications
  console.log('Fetching notifications...');
  const notificationsResponse = await userClient.notifications.listNotifications();

  const notifications = notificationsResponse.data?.data || [];
  console.log('Notifications found:', notifications.length);

  if (notifications.length === 0) {
    console.error('No notifications found!');
    process.exit(1);
  }

  // Step 5: Archive the most recent notification (first one)
  const notification = notifications[0];
  const notificationId = notification.id;
  console.log('Most recent notification ID:', notificationId);

  console.log('Archiving notification...');
  await userClient.notifications.archiveNotification(notificationId);

  console.log('Notification archived successfully!');

  // Step 6: Write the archived notification ID to output.log
  const logMessage = `Archived Notification ID: ${notificationId}\n`;
  const logPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(logPath, logMessage);
  console.log('Log written to:', logPath);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});