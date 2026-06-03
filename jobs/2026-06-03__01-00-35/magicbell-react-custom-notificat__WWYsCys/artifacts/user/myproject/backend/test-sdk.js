const { Client } = require('magicbell-js/project-client');

const runId = process.env.ZEALT_RUN_ID;
const email = process.env.MAGICBELL_EMAIL;
const [prefix, domain] = email.split('@');
const userEmail = `${prefix}+${runId}@${domain}`;
const externalId = `user-${runId}`;

console.log('User Email:', userEmail);
console.log('External ID:', externalId);

const client = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN
});

async function run() {
  try {
    console.log('Upserting user...');
    const userRes = await client.users.saveUser({
      email: userEmail,
      externalId: externalId
    });
    console.log('User upsert response status:', userRes.metadata.status);
    console.log('User data:', userRes.data);

    console.log('Sending broadcast notification...');
    const broadcastRes = await client.broadcasts.createBroadcast({
      title: `Test Notification ${runId}`,
      content: 'This is a test',
      recipients: [
        {
          externalId: externalId,
          email: userEmail
        }
      ]
    });
    console.log('Broadcast response status:', broadcastRes.metadata.status);
    console.log('Broadcast data:', broadcastRes.data);
  } catch (err) {
    console.error('Error in test:', err);
  }
}

run();
