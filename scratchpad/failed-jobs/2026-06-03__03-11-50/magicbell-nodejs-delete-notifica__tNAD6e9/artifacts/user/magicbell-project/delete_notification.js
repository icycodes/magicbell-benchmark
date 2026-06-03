const { Client } = require('magicbell-js/project-client');
const https = require('https');

const apiKey = process.env.MAGICBELL_API_KEY;
const apiSecret = process.env.MAGICBELL_SECRET_KEY;
const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
const runId = process.env.ZEALT_RUN_ID;
const email = process.env.MAGICBELL_EMAIL.replace('@', `+${runId}@`);

const client = new Client({ token: projectToken });

function request(method, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.magicbell.com',
      path,
      method,
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-API-SECRET': apiSecret,
        ...headers
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : null);
        } else {
          reject(new Error(`HTTP ${res.statusCode} on ${path}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  try {
    // 1. Create a broadcast
    const broadcastResponse = await client.broadcasts.createBroadcast({
      title: 'Test Notification for Deletion',
      recipients: [{ email }],
    });
    
    const broadcastId = broadcastResponse.data ? broadcastResponse.data.id : broadcastResponse.id;
    
    if (!broadcastId) {
      throw new Error('Broadcast ID not found in response: ' + JSON.stringify(broadcastResponse));
    }
    
    // 2. Poll for the notification
    let notificationId = null;
    for (let i = 0; i < 15; i++) {
      const data = await request('GET', `/broadcasts/${broadcastId}/notifications`);
      if (data && data.notifications && data.notifications.length > 0) {
        notificationId = data.notifications[0].id;
        break;
      }
      await sleep(1000);
    }
    
    if (!notificationId) {
      throw new Error('Notification was not created in time');
    }
    
    // 3. Delete the notification
    await request('DELETE', `/notifications/${notificationId}`, {
      'X-MAGICBELL-USER-EMAIL': email
    });
    
    console.log(`Deleted Notification ID: ${notificationId}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
