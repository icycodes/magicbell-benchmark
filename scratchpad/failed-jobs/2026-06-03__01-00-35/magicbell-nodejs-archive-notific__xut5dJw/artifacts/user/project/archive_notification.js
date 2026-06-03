const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { Client: ProjectClient } = require('magicbell-js/project-client');
const { Client: UserClient } = require('magicbell-js/user-client');

async function main() {
  try {
    const magicbellEmail = process.env.MAGICBELL_EMAIL;
    const zealtRunId = process.env.ZEALT_RUN_ID;
    const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;

    if (!magicbellEmail || !zealtRunId || !projectToken || !apiKey || !secretKey) {
      throw new Error('One or more required environment variables are missing.');
    }

    let targetEmail;
    if (magicbellEmail.includes('@')) {
      targetEmail = `${magicbellEmail.split('@')[0]}+${zealtRunId}@gmail.com`;
    } else {
      targetEmail = `${magicbellEmail}+${zealtRunId}@gmail.com`;
    }
    console.log(`Target User Email: ${targetEmail}`);

    // 1. Initialize MagicBell ProjectClient and create a broadcast
    console.log('Initializing ProjectClient...');
    const projectClient = new ProjectClient({
      token: projectToken
    });

    const broadcastBody = {
      title: `Notification for ${zealtRunId}`,
      content: `This is a test notification generated for run ${zealtRunId}.`,
      recipients: [
        {
          email: targetEmail
        }
      ]
    };

    console.log('Creating broadcast...');
    const broadcastResponse = await projectClient.broadcasts.createBroadcast(broadcastBody);
    console.log('Broadcast created successfully. Response status:', broadcastResponse.metadata.status);
    console.log('Broadcast ID:', broadcastResponse.data?.id);

    // 2. Generate User JWT using jsonwebtoken
    console.log('Generating User JWT...');
    const payload = {
      user_email: targetEmail,
      api_key: apiKey
    };
    const userJwt = jwt.sign(payload, secretKey, {
      algorithm: 'HS256',
      expiresIn: '1y'
    });
    console.log('User JWT generated successfully.');

    // 3. Initialize UserClient with the User JWT
    console.log('Initializing UserClient...');
    const userClient = new UserClient({
      token: userJwt
    });

    // 4. Fetch the notifications for the user, pick the first one, and archive it
    // We will poll for up to 30 seconds to make sure the notification is processed and appears in the inbox.
    let notifications = [];
    console.log('Fetching notifications for the user...');
    for (let attempt = 1; attempt <= 15; attempt++) {
      console.log(`Attempt ${attempt} to fetch notifications...`);
      const listResponse = await userClient.notifications.listNotifications({ limit: 10 });
      
      // We can check both listResponse.data?.data and parsing raw response just in case
      notifications = listResponse.data?.data || [];
      if (notifications.length === 0 && listResponse.raw) {
        try {
          const rawString = Buffer.from(listResponse.raw).toString('utf8');
          const parsed = JSON.parse(rawString);
          notifications = parsed.data || parsed.notifications || [];
        } catch (e) {
          // Ignore parse errors from raw
        }
      }

      console.log(`Found ${notifications.length} notifications.`);
      if (notifications.length > 0) {
        break;
      }
      console.log('No notifications found yet. Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (notifications.length === 0) {
      throw new Error('No notifications found in the user inbox after multiple attempts.');
    }

    // Pick the most recent notification (first in the list)
    const targetNotification = notifications[0];
    const notificationId = targetNotification.id;
    console.log(`Most recent notification details:`);
    console.log(`- ID: ${notificationId}`);
    console.log(`- Title: ${targetNotification.title}`);
    console.log(`- Created At: ${targetNotification.createdAt}`);
    console.log(`- Archived At: ${targetNotification.archivedAt}`);

    // 5. Archive the notification using UserClient
    console.log(`Archiving notification with ID ${notificationId}...`);
    const archiveResponse = await userClient.notifications.archiveNotification(notificationId);
    console.log('Archive response status:', archiveResponse.metadata.status);

    // 6. Write the ID of the archived notification to log file
    const logFilePath = '/home/user/project/output.log';
    const logContent = `Archived Notification ID: ${notificationId}\n`;
    fs.writeFileSync(logFilePath, logContent, 'utf8');
    console.log(`Successfully wrote to log file: ${logFilePath}`);
    console.log(`Log content: ${logContent.trim()}`);

  } catch (error) {
    console.error('An error occurred during execution:', error);
    process.exit(1);
  }
}

main();
