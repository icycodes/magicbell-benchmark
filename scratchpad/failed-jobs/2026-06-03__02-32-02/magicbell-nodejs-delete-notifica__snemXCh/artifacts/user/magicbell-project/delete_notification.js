'use strict';

const { Client } = require('magicbell-js/project-client');

const API_KEY = process.env.MAGICBELL_API_KEY;
const SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;
const PROJECT_TOKEN = process.env.MAGICBELL_PROJECT_TOKEN;
const EMAIL = process.env.MAGICBELL_EMAIL;
const RUN_ID = process.env.ZEALT_RUN_ID;

if (!API_KEY || !SECRET_KEY || !EMAIL || !RUN_ID) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Build recipient email in plus format: base+run-id@domain
const [localPart, domain] = EMAIL.split('@');
const recipientEmail = `${localPart}+${RUN_ID}@${domain}`;

const BASE_URL = 'https://api.magicbell.com';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createBroadcast(client) {
  const response = await client.broadcasts.createBroadcast({
    title: `Test notification for ${RUN_ID}`,
    content: `Notification created during run ${RUN_ID}`,
    recipients: [{ email: recipientEmail }],
  });
  return response.data;
}

async function fetchUserNotifications(email) {
  const url = `${BASE_URL}/notifications`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-MAGICBELL-API-KEY': API_KEY,
      'X-MAGICBELL-API-SECRET': SECRET_KEY,
      'X-MAGICBELL-USER-EMAIL': email,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch notifications: ${response.status} ${text}`);
  }

  return response.json();
}

async function deleteNotification(email, notificationId) {
  const url = `${BASE_URL}/notifications/${notificationId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'X-MAGICBELL-API-KEY': API_KEY,
      'X-MAGICBELL-API-SECRET': SECRET_KEY,
      'X-MAGICBELL-USER-EMAIL': email,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to delete notification: ${response.status} ${text}`);
  }

  return true;
}

async function main() {
  // Initialize the ProjectClient
  const client = new Client({
    token: PROJECT_TOKEN,
  });

  // Step 1: Create a broadcast notification for the recipient
  console.log(`Creating broadcast for recipient: ${recipientEmail}`);
  const broadcast = await createBroadcast(client);
  console.log(`Broadcast created with ID: ${broadcast.id}`);

  // Step 2: Wait for the broadcast to be processed and notification to appear
  let notification = null;
  const maxRetries = 10;
  const retryDelayMs = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Waiting for notification to be processed (attempt ${attempt}/${maxRetries})...`);
    await sleep(retryDelayMs);

    try {
      const notificationsData = await fetchUserNotifications(recipientEmail);
      const notifications = notificationsData.notifications || [];

      // Find the notification that matches our broadcast title
      notification = notifications.find(
        (n) => n.title === `Test notification for ${RUN_ID}`
      );

      if (notification) {
        console.log(`Found notification with ID: ${notification.id}`);
        break;
      }
    } catch (err) {
      console.log(`Error fetching notifications: ${err.message}`);
    }
  }

  if (!notification) {
    throw new Error('Notification not found after waiting for broadcast to process');
  }

  const notificationId = notification.id;

  // Step 3: Delete the notification using raw API with project auth
  console.log(`Deleting notification with ID: ${notificationId}`);
  await deleteNotification(recipientEmail, notificationId);

  // Step 4: Print the deleted notification ID
  console.log(`Deleted Notification ID: ${notificationId}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
