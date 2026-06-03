const { Client: ProjectClient } = require('magicbell-js/project-client');

const magicbellEmail = process.env.MAGICBELL_EMAIL;
const runId = process.env.ZEALT_RUN_ID;

if (!magicbellEmail || !runId) {
  console.error('Missing MAGICBELL_EMAIL or ZEALT_RUN_ID environment variables.');
  process.exit(1);
}

const [localPart, domain] = magicbellEmail.split('@');
const email = `${localPart}+${runId}@${domain}`;

const client = new ProjectClient({
  token: process.env.MAGICBELL_PROJECT_TOKEN,
});

async function main() {
  try {
    // 1. Create broadcast
    const broadcastRes = await client.broadcasts.createBroadcast({
      title: 'Notification for run ' + runId,
      content: 'This notification will be programmatically deleted.',
      customAttributes: {
        runId: runId
      },
      recipients: [
        { email: email }
      ]
    });

    if (!broadcastRes.data || !broadcastRes.data.id) {
      throw new Error('Failed to create broadcast.');
    }

    // 2. Poll for the generated notification to appear in the user's inbox
    const url = `https://api.magicbell.com/notifications`;
    let targetNotificationId = null;

    for (let i = 0; i < 30; i++) {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-MAGICBELL-API-KEY': process.env.MAGICBELL_API_KEY,
          'X-MAGICBELL-API-SECRET': process.env.MAGICBELL_SECRET_KEY,
          'X-MAGICBELL-USER-EMAIL': email,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.notifications && data.notifications.length > 0) {
        const matched = data.notifications.find(
          n => n.custom_attributes && n.custom_attributes.runId === runId
        );
        if (matched) {
          targetNotificationId = matched.id;
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!targetNotificationId) {
      throw new Error('Notification not found in user inbox after polling.');
    }

    // 3. Delete the notification
    const deleteUrl = `https://api.magicbell.com/notifications/${targetNotificationId}`;
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'X-MAGICBELL-API-KEY': process.env.MAGICBELL_API_KEY,
        'X-MAGICBELL-API-SECRET': process.env.MAGICBELL_SECRET_KEY,
        'X-MAGICBELL-USER-EMAIL': email,
      }
    });

    if (!deleteResponse.ok && deleteResponse.status !== 204) {
      throw new Error(`Failed to delete notification: ${deleteResponse.statusText}`);
    }

    // 4. Print the deleted notification ID to stdout
    console.log(`Deleted Notification ID: ${targetNotificationId}`);
  } catch (error) {
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

main();
