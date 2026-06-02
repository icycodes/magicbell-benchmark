const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Client: ProjectClient } = require('magicbell-js/project-client');
const { Client: UserClient } = require('magicbell-js/user-client');

async function main() {
  try {
    // 1. Read environment variables
    const runId = process.env.ZEALT_RUN_ID;
    const email = process.env.MAGICBELL_EMAIL;
    const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;

    if (!runId || !email || !projectToken || !apiKey || !secretKey) {
      console.error('Missing required environment variables.');
      console.error(`ZEALT_RUN_ID: ${runId ? 'set' : 'missing'}`);
      console.error(`MAGICBELL_EMAIL: ${email ? 'set' : 'missing'}`);
      console.error(`MAGICBELL_PROJECT_TOKEN: ${projectToken ? 'set' : 'missing'}`);
      console.error(`MAGICBELL_API_KEY: ${apiKey ? 'set' : 'missing'}`);
      console.error(`MAGICBELL_SECRET_KEY: ${secretKey ? 'set' : 'missing'}`);
      process.exit(1);
    }

    // 2. Compute plus-addressed mailbox
    const [local, domain] = email.split('@');
    const plusAddressedEmail = `${local}+mark-read-js-${runId}@${domain}`;
    const externalId = `user-mark-read-js-${runId}`;

    console.log(`Run ID: ${runId}`);
    console.log(`Recipient Email: ${plusAddressedEmail}`);
    console.log(`External ID: ${externalId}`);

    // 3. Initialise Project Client and upsert user
    console.log('Initializing Project Client...');
    const projectClient = new ProjectClient({ token: projectToken });

    console.log('Upserting user...');
    const userUpsertResponse = await projectClient.users.saveUser({
      externalId: externalId,
      email: plusAddressedEmail,
      firstName: 'MarkRead',
      lastName: `JS-${runId}`
    });
    console.log('User upserted successfully:', JSON.stringify(userUpsertResponse.data));

    // 4. Send a broadcast targeting that user
    const broadcastTitle = `Mark Read JS - ${runId}`;
    const broadcastBody = `Notification for mark-read JS run ${runId}.`;

    console.log('Sending broadcast...');
    const broadcastResponse = await projectClient.broadcasts.createBroadcast({
      title: broadcastTitle,
      content: broadcastBody,
      recipients: [
        { externalId: externalId }
      ]
    });
    console.log('Broadcast response:', JSON.stringify(broadcastResponse.data));

    // 5. Mint a User JWT
    console.log('Minting User JWT...');
    const jwtPayload = {
      user_email: plusAddressedEmail,
      user_external_id: externalId,
      api_key: apiKey
    };
    const userJwt = jwt.sign(jwtPayload, secretKey, {
      algorithm: 'HS256',
      expiresIn: '1y'
    });
    console.log('User JWT minted successfully.');

    // 6. Initialise User Client
    console.log('Initializing User Client...');
    const userClient = new UserClient({ token: userJwt });

    // 7. Poll to find the notification
    let notificationId = null;
    const maxAttempts = 15;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Polling for notification (attempt ${attempt}/${maxAttempts})...`);
      try {
        const listResponse = await userClient.notifications.listNotifications();
        const notifications = listResponse.data?.data || [];
        
        const matchedNotification = notifications.find(
          n => n.title === broadcastTitle && !n.readAt
        ) || notifications.find(
          n => n.title === broadcastTitle
        );
        
        if (matchedNotification) {
          notificationId = matchedNotification.id;
          console.log(`Notification found! ID: ${notificationId}`);
          break;
        }
      } catch (error) {
        console.error('Error during polling:', error.response?.data || error.message);
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    if (!notificationId) {
      throw new Error(`Could not find the notification with title "${broadcastTitle}" after ${maxAttempts} attempts.`);
    }

    // 8. Mark notification as read
    console.log(`Marking notification ${notificationId} as read...`);
    await userClient.notifications.markNotificationRead(notificationId);
    console.log('Notification marked as read.');

    // 9. Write notification ID to output.log
    const logPath = '/home/user/myproject/output.log';
    fs.writeFileSync(logPath, `Notification ID: ${notificationId}\n`);
    console.log(`Successfully wrote notification ID to ${logPath}`);

    // 10. Self-verification
    console.log('Performing self-verification via direct API call...');
    const verifyUrl = `https://api.magicbell.com/v2/notifications/${notificationId}`;
    const verifyResponse = await fetch(verifyUrl, {
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-USER-EXTERNAL-ID': externalId,
        'Authorization': `Bearer ${userJwt}`,
        'Accept': 'application/json'
      }
    });

    if (verifyResponse.status !== 200) {
      throw new Error(`Self-verification failed with status ${verifyResponse.status}`);
    }

    const verifyData = await verifyResponse.json();
    console.log('Self-verification notification data:', JSON.stringify(verifyData));
    
    const notificationObj = verifyData;

    if (notificationObj.title !== broadcastTitle) {
      throw new Error(`Self-verification title mismatch: expected "${broadcastTitle}", got "${notificationObj.title}"`);
    }

    if (!notificationObj.read_at) {
      throw new Error('Self-verification failed: read_at is null or undefined!');
    }

    console.log('Self-verification PASSED!');
    console.log(`read_at timestamp: ${notificationObj.read_at}`);

  } catch (error) {
    console.error('An error occurred during execution:', error);
    process.exit(1);
  }
}

main();
