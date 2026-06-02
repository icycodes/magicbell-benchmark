const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Client: ProjectClient } = require('magicbell-js/project-client');
const { Client: UserClient } = require('magicbell-js/user-client');

async function main() {
  try {
    // 1. Validate environment variables
    const runId = process.env.ZEALT_RUN_ID;
    const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;
    const emailBase = process.env.MAGICBELL_EMAIL;

    if (!runId || !projectToken || !apiKey || !secretKey || !emailBase) {
      throw new Error("Missing required environment variables.");
    }

    // 2. Derive user identifiers
    const [local, domain] = emailBase.split('@');
    const userEmail = `${local}+archive-js-${runId}@${domain}`;
    const userExternalId = `user-archive-js-${runId}`;
    const broadcastTitle = `Archive JS - ${runId}`;

    console.log(`User Email: ${userEmail}`);
    console.log(`User External ID: ${userExternalId}`);
    console.log(`Broadcast Title: ${broadcastTitle}`);

    // 3. Instantiate Project Client and Upsert User
    const projectClient = new ProjectClient({ token: projectToken });
    console.log("Upserting user...");
    const userRes = await projectClient.users.saveUser({
      externalId: userExternalId,
      email: userEmail
    });
    console.log("User upserted successfully:", userRes.data);

    // 4. Send Broadcast
    console.log("Sending broadcast...");
    const broadcastRes = await projectClient.broadcasts.createBroadcast({
      title: broadcastTitle,
      recipients: [
        { externalId: userExternalId }
      ]
    });
    console.log("Broadcast enqueued successfully:", broadcastRes.data);

    // 5. Generate HS256 User JWT
    console.log("Generating User JWT...");
    const payload = {
      user_email: userEmail,
      user_external_id: userExternalId,
      api_key: apiKey
    };
    const userJwt = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
    console.log("User JWT generated.");

    // 6. Instantiate User Client
    const userClient = new UserClient({ token: userJwt });

    // 7. Poll for notification
    let match = null;
    console.log("Polling for the notification...");
    for (let attempt = 1; attempt <= 15; attempt++) {
      console.log(`Attempt ${attempt}: Fetching notifications...`);
      const listRes = await userClient.notifications.listNotifications();
      const notifications = listRes.data?.data || [];
      match = notifications.find(n => n.title === broadcastTitle);

      if (match) {
        console.log(`Found matching notification: ID = ${match.id}`);
        break;
      }

      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!match) {
      throw new Error(`Failed to find notification with title "${broadcastTitle}" after polling.`);
    }

    // 8. Archive the notification
    console.log(`Archiving notification with ID: ${match.id}...`);
    await userClient.notifications.archiveNotification(match.id);
    console.log("Notification archived successfully.");

    // 9. Verify archived_at is a non-null timestamp
    console.log("Verifying archived_at timestamp...");
    const verifyRes = await userClient.notifications.fetchNotification(match.id);
    const archivedAt = verifyRes.data?.archivedAt;
    console.log(`Verified archived_at: ${archivedAt}`);
    if (!archivedAt) {
      throw new Error("Verification failed: archived_at is null or undefined.");
    }

    // 10. Write the archived notification id to log file
    const logFilePath = path.join(__dirname, 'output.log');
    const logContent = `Archived Notification ID: ${match.id}\n`;
    fs.writeFileSync(logFilePath, logContent, 'utf8');
    console.log(`Wrote to log file: ${logFilePath}`);

    console.log("All tasks completed successfully!");
  } catch (error) {
    console.error("An error occurred:", error);
    if (error.response) {
      try {
        console.error("API response error body:", await error.response.text());
      } catch (_) {}
    }
    process.exit(1);
  }
}

main();
