const { Client: ProjectClient } = require('magicbell-js/project-client');
const { Client: UserClient } = require('magicbell-js/user-client');
const jwt = require('jsonwebtoken');
const fs = require('fs');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const apiSecret = process.env.MAGICBELL_SECRET_KEY;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const emailStr = process.env.MAGICBELL_EMAIL;
  
  if (!runId || !apiKey || !apiSecret || !projectToken || !emailStr) {
    console.error("Missing environment variables");
    process.exit(1);
  }

  const emailParts = emailStr.split('@');
  const userEmail = `${emailParts[0]}+archive-js-${runId}@${emailParts[1]}`;
  const userExternalId = `user-archive-js-${runId}`;
  
  const projectClient = new ProjectClient({
    token: projectToken
  });

  console.log("Upserting user...");
  await projectClient.users.saveUser({
    externalId: userExternalId,
    email: userEmail
  });

  const broadcastTitle = `Archive JS - ${runId}`;
  console.log("Sending broadcast:", broadcastTitle);
  await projectClient.broadcasts.createBroadcast({
    title: broadcastTitle,
    recipients: [{ externalId: userExternalId }]
  });

  const payload = {
    user_email: userEmail,
    user_external_id: userExternalId,
    api_key: apiKey
  };
  const token = jwt.sign(payload, apiSecret, { algorithm: 'HS256' });

  const userClient = new UserClient({
    token: token
  });
  
  console.log("Polling for notification...");
  let notificationId = null;
  for (let i = 0; i < 30; i++) {
    const response = await userClient.notifications.listNotifications();
    const collection = response.data || response;
    const notifications = collection.data || collection.notifications || [];
    
    const target = notifications.find(n => n.title === broadcastTitle);
    if (target) {
      notificationId = target.id;
      break;
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  if (!notificationId) {
    console.error("Notification not found");
    process.exit(1);
  }

  console.log("Found notification:", notificationId);
  
  await userClient.notifications.archiveNotification(notificationId);
  console.log("Archived notification.");
  
  fs.writeFileSync('/home/user/myproject/output.log', `Archived Notification ID: ${notificationId}\n`);
}

main().catch(console.error);
