const { Client } = require('magicbell-js/project-client');

const API_BASE = 'https://api.magicbell.com/v2';

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const email = `REDACTED+${runId}@gmail.com`;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const notificationTitle = `Test Notification ${runId}`;

  console.log(`Run ID: ${runId}`);
  console.log(`Email: ${email}`);

  // Step 1: Create a broadcast using the ProjectClient
  const client = new Client({
    token: projectToken,
  });

  console.log('Creating broadcast...');
  const broadcastResponse = await client.broadcasts.createBroadcast({
    title: notificationTitle,
    content: `This is a test notification for run ${runId}`,
    recipients: [{ email }],
  });

  const broadcastData = broadcastResponse.data;
  console.log(`Broadcast created with ID: ${broadcastData.id}`);

  // Step 2: Wait for the broadcast to create notifications
  console.log('Waiting for broadcast to be processed...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Step 3: Poll for the notification to appear
  let notificationId = null;
  const maxRetries = 10;
  const retryDelay = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Attempt ${attempt}/${maxRetries}: Fetching notifications...`);

    // Try listing notifications with project auth (API key + secret + user email)
    const listResponse = await fetch(
      `${API_BASE}/notifications?per_page=100`,
      {
        headers: {
          'X-MAGICBELL-API-KEY': apiKey,
          'X-MAGICBELL-API-SECRET': secretKey,
          'X-MAGICBELL-USER-EMAIL': email,
        },
      }
    );

    if (listResponse.ok) {
      const data = await listResponse.json();
      const notifications = data.notifications || [];
      const notification = notifications.find(
        (n) => n.title === notificationTitle
      );
      if (notification) {
        notificationId = notification.id;
        console.log(`Found notification ID: ${notificationId}`);
        break;
      }
    } else {
      const errorText = await listResponse.text();
      console.log(
        `List notifications response: ${listResponse.status} - ${errorText}`
      );

      // Try with Bearer token as fallback
      const listResponse2 = await fetch(
        `${API_BASE}/notifications?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${projectToken}`,
          },
        }
      );

      if (listResponse2.ok) {
        const data2 = await listResponse2.json();
        const notifications2 = data2.notifications || [];
        const notification2 = notifications2.find(
          (n) => n.title === notificationTitle
        );
        if (notification2) {
          notificationId = notification2.id;
          console.log(`Found notification ID: ${notificationId}`);
          break;
        }
      }
    }

    if (attempt < maxRetries) {
      console.log('Notification not found yet, retrying...');
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  if (!notificationId) {
    console.error('Could not find notification ID after all retries');
    process.exit(1);
  }

  // Step 4: Delete the notification using project auth
  console.log(`Deleting notification ${notificationId}...`);

  let deleteSuccess = false;

  // Try with API key + secret + user email headers
  const deleteResponse = await fetch(
    `${API_BASE}/notifications/${notificationId}`,
    {
      method: 'DELETE',
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-API-SECRET': secretKey,
        'X-MAGICBELL-USER-EMAIL': email,
      },
    }
  );

  if (
    deleteResponse.status === 200 ||
    deleteResponse.status === 204 ||
    deleteResponse.status === 201
  ) {
    deleteSuccess = true;
  } else {
    console.log(
      `Delete with API key + secret failed: ${deleteResponse.status}`
    );
    const errorText = await deleteResponse.text();
    console.log(`Error: ${errorText}`);

    // Try with Bearer token as fallback
    const deleteResponse2 = await fetch(
      `${API_BASE}/notifications/${notificationId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${projectToken}`,
        },
      }
    );

    if (
      deleteResponse2.status === 200 ||
      deleteResponse2.status === 204 ||
      deleteResponse2.status === 201
    ) {
      deleteSuccess = true;
    } else {
      console.log(
        `Delete with Bearer token failed: ${deleteResponse2.status}`
      );
      const errorText2 = await deleteResponse2.text();
      console.log(`Error: ${errorText2}`);
    }
  }

  if (deleteSuccess) {
    console.log(`Deleted Notification ID: ${notificationId}`);
  } else {
    console.error('Failed to delete notification');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});