const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  
  if (!runId || !magicbellEmail || !apiKey || !secretKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const notificationId = process.argv[2];
  if (!notificationId) {
    console.error('Please provide a notification ID as the first argument');
    process.exit(1);
  }

  // Handle email generation
  let userEmail;
  if (magicbellEmail.includes('@')) {
    const [localPart, domain] = magicbellEmail.split('@');
    userEmail = `${localPart}+user_${runId}@${domain}`;
  } else {
    userEmail = `${magicbellEmail}+user_${runId}@gmail.com`;
  }

  const payload = {
    external_id: `user_${runId}`,
    user_email: userEmail,
    api_key: apiKey
  };

  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

  const client = new Client({ token });

  try {
    const response = await client.notifications.fetchNotification(notificationId);
    
    let title = 'Unknown';
    if (response && response.data) {
      if (response.data.title) {
        title = response.data.title;
      } else if (response.data.notification && response.data.notification.title) {
        title = response.data.notification.title;
      }
    }
    
    console.log(`Title: ${title}`);
  } catch (error) {
    console.error('Error fetching notification:', error.message);
    if (error.response && error.response.data) {
      console.error(JSON.stringify(error.response.data));
    }
  }
}

main();