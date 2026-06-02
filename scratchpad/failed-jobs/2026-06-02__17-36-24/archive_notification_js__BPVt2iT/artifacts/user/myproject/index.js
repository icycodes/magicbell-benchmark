'use strict';

const { Client: ProjectClient } = require('magicbell-js/project-client');
const { Client: UserClient } = require('magicbell-js/user-client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Read environment variables
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  if (!runId || !magicbellEmail || !projectToken || !apiKey || !secretKey) {
    throw new Error('Missing required environment variables');
  }

  // Construct identifiers
  const externalId = `user-archive-js-${runId}`;
  const [local, domain] = magicbellEmail.split('@');
  const userEmail = `${local}+archive-js-${runId}@${domain}`;
  const broadcastTitle = `Archive JS - ${runId}`;

  console.log(`Run ID: ${runId}`);
  console.log(`External ID: ${externalId}`);
  console.log(`User Email: ${userEmail}`);
  console.log(`Broadcast Title: ${broadcastTitle}`);

  // Initialize project client
  const projectClient = new ProjectClient({ token: projectToken });

  // Step 1: Upsert MagicBell user
  console.log('\nStep 1: Upserting user...');
  const upsertResponse = await projectClient.users.saveUser({
    externalId: externalId,
    email: userEmail,
  });
  console.log(`User upserted - status: ${upsertResponse.metadata.status}`);

  // Step 2: Send broadcast targeted at this user
  console.log('\nStep 2: Sending broadcast...');
  const broadcastResponse = await projectClient.broadcasts.createBroadcast({
    title: broadcastTitle,
    recipients: [{ externalId: externalId }],
  });
  console.log(`Broadcast created - status: ${broadcastResponse.metadata.status}`);
  const broadcastData = broadcastResponse.data;
  console.log(`Broadcast ID: ${broadcastData?.id}`);

  // Step 3: Sign User JWT
  console.log('\nStep 3: Signing User JWT...');
  const userJwt = jwt.sign(
    {
      user_email: userEmail,
      user_external_id: externalId,
      api_key: apiKey,
    },
    secretKey,
    { algorithm: 'HS256' }
  );
  console.log('JWT signed successfully');

  // Step 4: Initialize User Client
  const userClient = new UserClient({ token: userJwt });

  // Step 5: Poll for the notification matching the broadcast title
  console.log('\nStep 4: Polling for notification...');
  let targetNotification = null;
  const maxAttempts = 20;
  const pollIntervalMs = 3000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`  Poll attempt ${attempt}/${maxAttempts}...`);
    const listResponse = await userClient.notifications.listNotifications({ limit: 50 });
    const notifications = listResponse.data?.data ?? listResponse.data?.notifications ?? [];

    targetNotification = notifications.find((n) => n.title === broadcastTitle);
    if (targetNotification) {
      console.log(`  Found notification: ${targetNotification.id}`);
      break;
    }

    if (attempt < maxAttempts) {
      console.log(`  Not found yet, waiting ${pollIntervalMs}ms...`);
      await sleep(pollIntervalMs);
    }
  }

  if (!targetNotification) {
    throw new Error(`Notification with title "${broadcastTitle}" not found after ${maxAttempts} attempts`);
  }

  // Step 6: Archive the notification
  console.log(`\nStep 5: Archiving notification ${targetNotification.id}...`);
  const archiveResponse = await userClient.notifications.archiveNotification(targetNotification.id);
  console.log(`Archive response status: ${archiveResponse.metadata.status}`);

  // Step 7: Write to output log
  const logPath = path.join(__dirname, 'output.log');
  const logLine = `Archived Notification ID: ${targetNotification.id}`;
  fs.writeFileSync(logPath, logLine + '\n', 'utf8');
  console.log(`\nLog written to ${logPath}`);
  console.log(logLine);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
