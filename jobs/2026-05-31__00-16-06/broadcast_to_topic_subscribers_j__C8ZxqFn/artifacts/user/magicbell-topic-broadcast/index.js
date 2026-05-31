const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;
const MAGICBELL_PROJECT_TOKEN = process.env.MAGICBELL_PROJECT_TOKEN;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;

const LOG_FILE = path.join(__dirname, 'output.log');

async function main() {
  try {
    // Validate environment variables
    if (!MAGICBELL_API_KEY || !MAGICBELL_SECRET_KEY || !MAGICBELL_PROJECT_TOKEN || !ZEALT_RUN_ID) {
      throw new Error('Missing required environment variables: MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, MAGICBELL_PROJECT_TOKEN, ZEALT_RUN_ID');
    }

    const runId = ZEALT_RUN_ID;
    const userEmail = `user+${runId}@gmail.com`;
    const userExternalId = `user-${runId}`;
    const topicName = `announcements-${runId}`;

    // Clear/create log file
    fs.writeFileSync(LOG_FILE, '');

    function log(message) {
      console.log(message);
      fs.appendFileSync(LOG_FILE, message + '\n');
    }

    // Step 1: Create user
    log(`Creating user: ${userEmail}`);
    const createUserResponse = await fetch('https://api.magicbell.com/v2/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MAGICBELL-API-KEY': MAGICBELL_API_KEY,
        'X-MAGICBELL-API-SECRET': MAGICBELL_SECRET_KEY,
      },
      body: JSON.stringify({
        user: {
          external_id: userExternalId,
          email: userEmail,
          first_name: 'Test',
          last_name: 'User',
        },
      }),
    });

    if (!createUserResponse.ok) {
      const errorText = await createUserResponse.text();
      throw new Error(`Failed to create user: ${createUserResponse.status} - ${errorText}`);
    }

    const userData = await createUserResponse.json();
    log(`User Created: ${userEmail}`);

    // Step 2: Generate User JWT
    const userJwtPayload = {
      user_email: userEmail,
      user_external_id: userExternalId,
      api_key: MAGICBELL_API_KEY,
    };

    const userJwt = jwt.sign(userJwtPayload, MAGICBELL_SECRET_KEY, {
      algorithm: 'HS256',
    });

    log(`User JWT Generated: ${userJwt}`);

    // Step 3: Subscribe user to topic
    log(`Subscribing to topic: ${topicName}`);
    const subscribeResponse = await fetch('https://api.magicbell.com/v2/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userJwt}`,
      },
      body: JSON.stringify({
        topic: topicName,
      }),
    });

    if (!subscribeResponse.ok) {
      const errorText = await subscribeResponse.text();
      throw new Error(`Failed to subscribe to topic: ${subscribeResponse.status} - ${errorText}`);
    }

    log(`Subscribed to Topic: ${topicName}`);

    // Step 4: Broadcast notification to topic subscribers
    log(`Sending broadcast to topic: ${topicName}`);
    const broadcastResponse = await fetch('https://api.magicbell.com/v2/broadcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAGICBELL_PROJECT_TOKEN}`,
      },
      body: JSON.stringify({
        title: `System Update - ${runId}`,
        content: 'This is a broadcast to all subscribers.',
        topic: topicName,
        recipients: [
          {
            topic: {
              subscribers: true,
            },
          },
        ],
      }),
    });

    if (!broadcastResponse.ok) {
      const errorText = await broadcastResponse.text();
      throw new Error(`Failed to send broadcast: ${broadcastResponse.status} - ${errorText}`);
    }

    const broadcastData = await broadcastResponse.json();
    const broadcastId = broadcastData.broadcast?.id || broadcastData.id || 'unknown';
    log(`Broadcast Sent ID: ${broadcastId}`);

    // Step 5: Verify delivery - fetch user notifications
    log('Verifying notification delivery...');
    // Wait a moment for the notification to be delivered
    await new Promise((resolve) => setTimeout(resolve, 3000));

    let notificationFound = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!notificationFound && attempts < maxAttempts) {
      attempts++;
      const notificationsResponse = await fetch('https://api.magicbell.com/v2/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userJwt}`,
        },
      });

      if (!notificationsResponse.ok) {
        const errorText = await notificationsResponse.text();
        throw new Error(`Failed to fetch notifications: ${notificationsResponse.status} - ${errorText}`);
      }

      const notificationsData = await notificationsResponse.json();
      const notifications = notificationsData.notifications || [];

      const targetNotification = notifications.find(
        (n) => n.title === `System Update - ${runId}`
      );

      if (targetNotification) {
        log(`Notification Received Title: ${targetNotification.title}`);
        notificationFound = true;
      } else if (attempts < maxAttempts) {
        log(`Attempt ${attempts}/${maxAttempts}: Notification not yet found, retrying in 3s...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    if (!notificationFound) {
      throw new Error(`Notification with title "System Update - ${runId}" was not found after ${maxAttempts} attempts`);
    }

    log('All steps completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    fs.appendFileSync(LOG_FILE, `Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();