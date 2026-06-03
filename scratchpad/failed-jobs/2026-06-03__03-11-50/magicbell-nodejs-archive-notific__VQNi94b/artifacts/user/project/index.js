const fs = require('fs');
const jwt = require('jsonwebtoken');
const { Client: ProjectClient } = require('magicbell-js/project-client');
const { Client: UserClient } = require('magicbell-js/user-client');

async function main() {
  try {
    let targetEmail = `${process.env.MAGICBELL_EMAIL}+${process.env.ZEALT_RUN_ID}@gmail.com`;
    if (process.env.MAGICBELL_EMAIL.includes('@')) {
      const [name, domain] = process.env.MAGICBELL_EMAIL.split('@');
      targetEmail = `${name}+${process.env.ZEALT_RUN_ID}@${domain}`;
    }
    
    console.log(`Target Email: ${targetEmail}`);

    // 1. Initialize ProjectClient and create a broadcast
    const projectClient = new ProjectClient({ token: process.env.MAGICBELL_PROJECT_TOKEN || process.env.MAGICBELL_API_KEY });
    
    console.log('Creating broadcast...');
    const broadcastResponse = await projectClient.broadcasts.createBroadcast({
      title: 'Test Notification for Archiving',
      recipients: [{ email: targetEmail }]
    });
    
    console.log('Broadcast created successfully:', broadcastResponse.data.id);

    // 2. Generate User JWT
    const payload = {
      user_email: targetEmail,
      api_key: process.env.MAGICBELL_API_KEY
    };
    
    const userJwt = jwt.sign(payload, process.env.MAGICBELL_SECRET_KEY, {
      algorithm: 'HS256',
      expiresIn: '1h'
    });
    console.log('User JWT generated successfully.');

    // 3. Initialize UserClient
    const userClient = new UserClient({ token: userJwt });

    // 4. Fetch the user's notifications (poll)
    console.log('Fetching notifications...');
    let notifications = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const notificationsResponse = await userClient.notifications.listNotifications({ limit: 5 });
      notifications = notificationsResponse.data.data;
      if (notifications && notifications.length > 0) {
        break;
      }
      console.log('Waiting for notification to arrive...');
    }

    if (!notifications || notifications.length === 0) {
      throw new Error('No notifications found after polling.');
    }

    const mostRecentNotification = notifications[0];
    console.log('Most recent notification ID:', mostRecentNotification.id);

    // 5. Archive the most recent notification
    console.log('Archiving notification...');
    await userClient.notifications.archiveNotification(mostRecentNotification.id);
    console.log('Notification archived successfully.');

    // 6. Write the ID to output.log
    const logContent = `Archived Notification ID: ${mostRecentNotification.id}\n`;
    fs.writeFileSync('/home/user/project/output.log', logContent);
    console.log('Wrote to output.log');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
