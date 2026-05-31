import jwt from 'jsonwebtoken';
import { Client as UserClient } from 'magicbell-js/user-client';
import fs from 'fs';

const LOG_FILE = '/home/user/magicbell-flow/flow.log';
const JWT_FILE = '/home/user/magicbell-flow/user_jwt.txt';
const API_BASE_V1 = 'https://api.magicbell.com';
const API_BASE_V2 = 'https://api.magicbell.com/v2';

async function main() {
  // Step 1: Read environment variables
  const runId = process.env.ZEALT_RUN_ID;
  const gmailUserName = process.env.GMAIL_USER_NAME;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  if (!runId || !gmailUserName || !apiKey || !secretKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  // Step 2: Construct user attributes
  const externalId = `usr_${runId}`;
  const email = `${gmailUserName}+${runId}@gmail.com`;

  console.log(`External ID: ${externalId}`);
  console.log(`Email: ${email}`);

  // Step 3: Generate User JWT using HMAC-HS256
  // The User JWT payload uses user_email and user_external_id per MagicBell spec
  const payload = {
    api_key: apiKey,
    user_external_id: externalId,
    user_email: email,
  };

  const userJwt = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

  // Step 4: Write the User JWT to file
  fs.writeFileSync(JWT_FILE, userJwt, 'utf-8');
  console.log(`User JWT written to ${JWT_FILE}`);

  // Step 5: Save/upsert the user using v1 API with API key and secret headers
  console.log('Saving user...');
  const saveUserResponse = await fetch(`${API_BASE_V1}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MAGICBELL-API-KEY': apiKey,
      'X-MAGICBELL-API-SECRET': secretKey,
    },
    body: JSON.stringify({
      user: {
        external_id: externalId,
        email: email,
        first_name: 'Test',
        last_name: 'User',
      },
    }),
  });

  if (!saveUserResponse.ok && saveUserResponse.status !== 422) {
    // 422 might mean user already exists, which is fine
    const errorBody = await saveUserResponse.text();
    console.error(`Failed to save user: ${saveUserResponse.status} ${errorBody}`);
    process.exit(1);
  }

  const userData = await saveUserResponse.json();
  console.log(`User saved: ${JSON.stringify(userData)}`);

  // Step 6: Create a broadcast using v1 API with API key and secret headers
  const broadcastTitle = `Alert - ${runId}`;
  const broadcastContent = `This is a test notification for run ${runId}.`;

  console.log('Creating broadcast...');
  const broadcastResponse = await fetch(`${API_BASE_V1}/broadcasts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MAGICBELL-API-KEY': apiKey,
      'X-MAGICBELL-API-SECRET': secretKey,
    },
    body: JSON.stringify({
      broadcast: {
        title: broadcastTitle,
        content: broadcastContent,
        recipients: [
          {
            external_id: externalId,
            email: email,
          },
        ],
      },
    }),
  });

  if (!broadcastResponse.ok) {
    const errorBody = await broadcastResponse.text();
    console.error(`Failed to create broadcast: ${broadcastResponse.status} ${errorBody}`);
    process.exit(1);
  }

  const broadcastData = await broadcastResponse.json();
  const broadcastId = broadcastData.broadcast?.id || broadcastData.id;
  console.log(`Broadcast created with ID: ${broadcastId}`);

  // Step 7: Initialize UserClient (user context with User JWT) using v2 SDK
  const userClient = new UserClient({
    token: userJwt,
  });

  // Step 8: Wait for the notification to be delivered, then list notifications
  console.log('Waiting for notification delivery...');
  let notification = null;
  const maxRetries = 15;
  const retryDelayMs = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Attempt ${attempt}/${maxRetries} to find notification...`);
    const listResponse = await userClient.notifications.listNotifications();

    const notifications = listResponse.data?.data || [];
    notification = notifications.find((n) => n.title === broadcastTitle);

    if (notification) {
      console.log(`Found notification: ${notification.id}`);
      break;
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  if (!notification) {
    console.error('Could not find the notification after maximum retries');
    process.exit(1);
  }

  const notificationId = notification.id;

  // Step 9: Verify it is unread
  const isUnread = notification.readAt === null || notification.readAt === undefined;
  const initialState = isUnread ? 'unread' : 'read';
  console.log(`Notification Initial State: ${initialState}`);

  // Step 10: Write to flow.log
  const logLines = [];
  logLines.push(`Broadcast ID: ${broadcastId}`);
  logLines.push(`Notification ID: ${notificationId}`);
  logLines.push(`Notification Initial State: ${initialState}`);

  // Step 11: Mark the notification as read
  console.log(`Marking notification ${notificationId} as read...`);
  await userClient.notifications.markNotificationRead(notificationId);

  // Step 12: List notifications again and check updated state
  const updatedListResponse = await userClient.notifications.listNotifications();
  const updatedNotifications = updatedListResponse.data?.data || [];
  const updatedNotification = updatedNotifications.find((n) => n.id === notificationId);

  const isRead = updatedNotification && updatedNotification.readAt !== null && updatedNotification.readAt !== undefined;
  const updatedState = isRead ? 'read' : 'unread';
  console.log(`Notification Updated State: ${updatedState}`);

  logLines.push(`Notification Updated State: ${updatedState}`);

  // Step 13: Write log file
  fs.writeFileSync(LOG_FILE, logLines.join('\n') + '\n', 'utf-8');
  console.log(`Log written to ${LOG_FILE}`);
  console.log('Flow completed successfully!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});