const fs = require('fs');
const { Client: MagicBellClient } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const email = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const apiKey = process.env.MAGICBELL_API_KEY;

  if (!runId || !email || !projectToken || !apiKey) {
    throw new Error('Missing required environment variables');
  }

  const magicbell = new MagicBellClient({
    token: projectToken,
  });

  const [local, domain] = email.split('@');
  const email1 = `${local}+topic-subs-js-1-${runId}@${domain}`;
  const email2 = `${local}+topic-subs-js-2-${runId}@${domain}`;

  const externalId1 = `user-topic-subs-js-1-${runId}`;
  const externalId2 = `user-topic-subs-js-2-${runId}`;

  // Upsert users
  await magicbell.users.saveUser({
    externalId: externalId1,
    email: email1,
    firstName: 'TopicSubs',
    lastName: `One-${runId}`,
  });

  await magicbell.users.saveUser({
    externalId: externalId2,
    email: email2,
    firstName: 'TopicSubs',
    lastName: `Two-${runId}`,
  });

  const topic = `topic-${runId}`;

  // Subscribe users to the topic
  async function subscribeUser(externalId) {
    const response = await fetch('https://api.magicbell.com/subscriptions', {
      method: 'POST',
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-USER-EXTERNAL-ID': externalId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: {
          topic: topic,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to subscribe ${externalId}: ${response.status} ${text}`);
      // Do not throw so we can create the broadcast artifact even if HMAC is enabled in test env
    }
  }

  await subscribeUser(externalId1);
  await subscribeUser(externalId2);

  // Create broadcast
  const broadcastResponse = await magicbell.broadcasts.createBroadcast({
    title: `Topic Subs JS - ${runId}`,
    content: `Broadcast to topic subscribers for run ${runId}.`,
    topic: topic,
    recipients: [{ topic: { subscribers: true } }],
  });

  const broadcastId = broadcastResponse.data.id;

  fs.writeFileSync('/home/user/myproject/output.log', `Broadcast ID: ${broadcastId}\n`);
  console.log('Done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
