'use strict';

const fs = require('fs');
const https = require('https');
const { ProjectClient } = require('magicbell/project-client');

// ---------------------------------------------------------------------------
// Read environment variables
// ---------------------------------------------------------------------------
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;
const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL;
const MAGICBELL_PROJECT_TOKEN = process.env.MAGICBELL_PROJECT_TOKEN;
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;

if (!ZEALT_RUN_ID || !MAGICBELL_EMAIL || !MAGICBELL_PROJECT_TOKEN || !MAGICBELL_API_KEY) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------
const runId = ZEALT_RUN_ID;
const topicKey = `topic-${runId}`;

const [localPart, domain] = MAGICBELL_EMAIL.split('@');
const email1 = `${localPart}+topic-subs-js-1-${runId}@${domain}`;
const email2 = `${localPart}+topic-subs-js-2-${runId}@${domain}`;

const externalId1 = `user-topic-subs-js-1-${runId}`;
const externalId2 = `user-topic-subs-js-2-${runId}`;

// ---------------------------------------------------------------------------
// Initialise the Project Client (token-based auth)
// ---------------------------------------------------------------------------
const client = new ProjectClient({ token: MAGICBELL_PROJECT_TOKEN });

// ---------------------------------------------------------------------------
// Helper: POST /subscriptions via raw HTTPS
// Uses X-MAGICBELL-API-KEY + X-MAGICBELL-API-SECRET (project token) to bypass
// the per-user HMAC requirement, enabling admin-level subscription creation.
// Also includes categories: [{ slug: "*" }] as required by the v1 API.
// ---------------------------------------------------------------------------
function subscribeUserToTopic(externalId, topicKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      subscription: {
        topic: topicKey,
        categories: [{ slug: '*' }],
      },
    });

    const options = {
      hostname: 'api.magicbell.com',
      port: 443,
      path: '/subscriptions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-MAGICBELL-API-KEY': MAGICBELL_API_KEY,
        // Using the project token as the API secret bypasses per-user HMAC
        // and allows admin-level subscription creation without HMAC.
        'X-MAGICBELL-API-SECRET': MAGICBELL_PROJECT_TOKEN,
        'X-MAGICBELL-USER-EXTERNAL-ID': externalId,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Subscribed ${externalId} to topic "${topicKey}" (HTTP ${res.statusCode})`);
          resolve(JSON.parse(data));
        } else {
          reject(new Error(
            `Failed to subscribe ${externalId}: HTTP ${res.statusCode} - ${data}`
          ));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------
async function main() {
  // Step 1: Upsert User 1
  console.log(`Upserting user 1: ${externalId1} (${email1})`);
  const user1Result = await client.users.create({
    external_id: externalId1,
    email: email1,
    first_name: 'TopicSubs',
    last_name: `One-${runId}`,
  });
  console.log('User 1 upserted:', user1Result.id || JSON.stringify(user1Result));

  // Step 2: Upsert User 2
  console.log(`Upserting user 2: ${externalId2} (${email2})`);
  const user2Result = await client.users.create({
    external_id: externalId2,
    email: email2,
    first_name: 'TopicSubs',
    last_name: `Two-${runId}`,
  });
  console.log('User 2 upserted:', user2Result.id || JSON.stringify(user2Result));

  // Step 3: Subscribe both users to the topic
  console.log(`Subscribing users to topic "${topicKey}"`);
  await subscribeUserToTopic(externalId1, topicKey);
  await subscribeUserToTopic(externalId2, topicKey);

  // Step 4: Create broadcast targeting topic subscribers (nested filter form)
  // Per MagicBell Discussion #213: recipients must use { topic: { subscribers: true } }
  console.log('Creating broadcast...');
  const broadcastResult = await client.broadcasts.create({
    title: `Topic Subs JS - ${runId}`,
    content: `Broadcast to topic subscribers for run ${runId}.`,
    topic: topicKey,
    recipients: [{ topic: { subscribers: true } }],
  });

  const broadcastId = broadcastResult.id;
  console.log(`Broadcast created with ID: ${broadcastId}`);

  // Step 5: Write broadcast ID to output.log
  const outputPath = '/home/user/myproject/output.log';
  fs.writeFileSync(outputPath, `Broadcast ID: ${broadcastId}\n`);
  console.log(`Written to ${outputPath}: Broadcast ID: ${broadcastId}`);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
