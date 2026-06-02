const fs = require('fs');
const jwt = require('jsonwebtoken');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  if (!runId || !magicbellEmail || !projectToken || !apiKey || !secretKey) {
    throw new Error('Missing required environment variables');
  }

  // Compute per-run recipient email
  const [local, domain] = magicbellEmail.split('@');
  const userEmail = `${local}+mark-read-js-${runId}@${domain}`;
  const externalId = `user-mark-read-js-${runId}`;

  // Initialize Project Client
  const { Client: ProjectClient } = require('magicbell-js/project-client');
  const projectClient = new ProjectClient({ token: projectToken });

  console.log('Upserting user...');
  await projectClient.users.saveUser({
    externalId,
    email: userEmail,
    firstName: 'MarkRead',
    lastName: `JS-${runId}`,
  });
  console.log('User upserted successfully.');

  console.log('Sending broadcast...');
  const broadcastTitle = `Mark Read JS - ${runId}`;
  await projectClient.broadcasts.createBroadcast({
    title: broadcastTitle,
    content: `Notification for mark-read JS run ${runId}.`,
    recipients: [{ externalId }],
  });
  console.log('Broadcast sent.');

  // Mint User JWT
  const userJwt = jwt.sign(
    {
      user_email: userEmail,
      user_external_id: externalId,
      api_key: apiKey,
    },
    secretKey,
    { expiresIn: '1y' }
  );

  // Initialize User Client
  const { Client: UserClient } = require('magicbell-js/user-client');
  const userClient = new UserClient({ token: userJwt });

  let notificationId = null;
  let attempts = 0;
  const maxAttempts = 10;
  const delayMs = 2000;

  console.log('Polling for notification...');
  while (attempts < maxAttempts) {
    const response = await userClient.notifications.listNotifications();
    const notifications = response.data?.data || [];
    
    // The response data structure might be { data: [Notification] } or { data: { notifications: [Notification] } }
    // Let's inspect it dynamically
    const list = Array.isArray(notifications) ? notifications : (notifications.notifications || []);
    
    const targetNotification = list.find(n => n.title === broadcastTitle);
    
    if (targetNotification) {
      notificationId = targetNotification.id;
      break;
    }

    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts}. Notification not found. Retrying in ${delayMs}ms...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  if (!notificationId) {
    throw new Error('Notification not found after polling.');
  }

  console.log(`Found notification with ID: ${notificationId}`);

  console.log('Marking notification as read...');
  await userClient.notifications.markNotificationRead(notificationId);
  console.log('Notification marked as read.');

  fs.writeFileSync('/home/user/myproject/output.log', `Notification ID: ${notificationId}\n`);
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
