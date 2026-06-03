const { Client: ProjectClient } = require('magicbell-js/project-client');
const { Client: UserClient } = require('magicbell-js/user-client');
const jwt = require('jsonwebtoken');
const fs = require('fs');

async function main() {
  // Read environment variables
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const zealthRunId = process.env.ZEALT_RUN_ID;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  if (!magicbellEmail || !zealthRunId || !projectToken || !apiKey || !secretKey) {
    throw new Error(
      'Missing required environment variables: MAGICBELL_EMAIL, ZEALT_RUN_ID, MAGICBELL_PROJECT_TOKEN, MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY'
    );
  }

  // Build the user email: take local part of MAGICBELL_EMAIL (before @) + + + ZEALT_RUN_ID + @gmail.com
  const localPart = magicbellEmail.includes('@') ? magicbellEmail.split('@')[0] : magicbellEmail;
  const userEmail = `${localPart}+${zealthRunId}@gmail.com`;
  console.log(`Target user email: ${userEmail}`);

  // Step 1: Initialize ProjectClient and create a broadcast to the user
  const projectClient = new ProjectClient({ token: projectToken });

  console.log('Creating broadcast...');
  const broadcastResponse = await projectClient.broadcasts.createBroadcast({
    title: 'Test Notification',
    content: 'This is a test notification for archiving.',
    recipients: [{ email: userEmail }],
  });
  console.log('Broadcast created:', broadcastResponse.data?.id);

  // Wait for the notification to be generated and delivered
  console.log('Waiting for notification delivery...');
  await new Promise((resolve) => setTimeout(resolve, 8000));

  // Step 2: Generate a User JWT using HS256
  // MagicBell User JWT payload must include user_email and api_key
  const userJwt = jwt.sign(
    {
      user_email: userEmail,
      api_key: apiKey,
    },
    secretKey,
    { algorithm: 'HS256', expiresIn: '1h' }
  );
  console.log('Generated User JWT');

  // Step 3: Initialize UserClient with the JWT
  const userClient = new UserClient({ token: userJwt });

  // Step 4: Fetch notifications for the user (with retries)
  let notifications = null;
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Fetching notifications (attempt ${attempt}/${maxAttempts})...`);
    const notificationsResponse = await userClient.notifications.listNotifications({ limit: 10 });
    // The SDK returns { data: [...notifications], links: {...} }
    notifications = notificationsResponse.data?.data;
    console.log(`Response data keys: ${JSON.stringify(Object.keys(notificationsResponse.data || {}))}`);
    console.log(`Notifications count: ${notifications ? notifications.length : 0}`);
    if (notifications && notifications.length > 0) {
      break;
    }
    if (attempt < maxAttempts) {
      console.log('No notifications yet, waiting 5 seconds before retry...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  if (!notifications || notifications.length === 0) {
    throw new Error('No notifications found for the user after multiple attempts.');
  }

  const firstNotification = notifications[0];
  const notificationId = firstNotification.id;
  console.log(`Found notification ID: ${notificationId}`);

  // Step 5: Archive the most recent notification
  console.log(`Archiving notification ${notificationId}...`);
  await userClient.notifications.archiveNotification(notificationId);
  console.log(`Notification ${notificationId} archived successfully.`);

  // Step 6: Write the archived notification ID to output.log
  const logContent = `Archived Notification ID: ${notificationId}\n`;
  fs.writeFileSync('/home/user/project/output.log', logContent);
  console.log('Written to output.log:', logContent.trim());
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
