const fs = require('fs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;
const MAGICBELL_PROJECT_TOKEN = process.env.MAGICBELL_PROJECT_TOKEN;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;

const runId = ZEALT_RUN_ID;
const email = `user+${runId}@gmail.com`;
const externalId = `user-${runId}`;
const topicName = `announcements-${runId}`;
const logFile = '/home/user/magicbell-topic-broadcast/output.log';

function log(message) {
  fs.appendFileSync(logFile, message + '\n');
}

async function main() {
  try {
    // 1. Create a new user
    await axios.post(
      'https://api.magicbell.com/v2/users',
      {
        user: {
          external_id: externalId,
          email: email,
          first_name: 'Test',
          last_name: 'User',
        }
      },
      {
        headers: {
          'X-MAGICBELL-API-KEY': MAGICBELL_API_KEY,
          'X-MAGICBELL-API-SECRET': MAGICBELL_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    log(`User Created: ${email}`);

    // 2. Generate User JWT
    const payload = {
      user_email: email,
      user_external_id: externalId,
      api_key: MAGICBELL_API_KEY
    };
    const userJwt = jwt.sign(payload, MAGICBELL_SECRET_KEY, { algorithm: 'HS256' });
    log(`User JWT Generated: ${userJwt}`);

    // 3. Subscribe user to topic
    await axios.post(
      'https://api.magicbell.com/v2/subscriptions',
      {
        topic: topicName
      },
      {
        headers: {
          'Authorization': `Bearer ${userJwt}`,
          'Content-Type': 'application/json'
        }
      }
    );
    log(`Subscribed to Topic: ${topicName}`);

    // 4. Broadcast a notification
    const broadcastResponse = await axios.post(
      'https://api.magicbell.com/broadcasts',
      {
        broadcast: {
          title: `System Update - ${runId}`,
          content: 'This is a broadcast to all subscribers.',
          topic: topicName,
          recipients: [
            { topic: { subscribers: true } }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${MAGICBELL_PROJECT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    log(`Broadcast Sent ID: ${broadcastResponse.data.broadcast.id}`);

    // 5. Verify delivery
    let notificationReceived = false;
    let titleReceived = '';
    
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const notifResponse = await axios.get(
        'https://api.magicbell.com/v2/notifications',
        {
          headers: {
            'Authorization': `Bearer ${userJwt}`
          }
        }
      );
      
      const notifications = notifResponse.data.notifications;
      const notif = notifications.find(n => n.title === `System Update - ${runId}`);
      if (notif) {
        notificationReceived = true;
        titleReceived = notif.title;
        break;
      }
    }

    if (notificationReceived) {
      log(`Notification Received Title: ${titleReceived}`);
    } else {
      console.error('Notification not received.');
    }

  } catch (error) {
    if (error.response) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

main();
