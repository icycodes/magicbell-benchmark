const { Client } = require('magicbell-js/project-client');
const client = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN
});

const runId = process.env.ZEALT_RUN_ID;
const email = process.env.MAGICBELL_EMAIL.replace('@', `+${runId}@`);

async function run() {
  console.log('Sending to', email);
  const response = await client.broadcasts.createBroadcast({
    title: 'Test Notification',
    recipients: [{ email }],
  });
  console.log(JSON.stringify(response, null, 2));
}
run().catch(console.error);
