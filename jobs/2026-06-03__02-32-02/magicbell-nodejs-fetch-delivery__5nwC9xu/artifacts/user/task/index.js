const { Client } = require('magicbell-js/project-client');

async function main() {
  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  const email = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;

  if (!token) throw new Error('MAGICBELL_PROJECT_TOKEN is not set');
  if (!email) throw new Error('MAGICBELL_EMAIL is not set');
  if (!runId) throw new Error('ZEALT_RUN_ID is not set');

  // Construct recipient email: insert +<runId> before the @ symbol
  const atIndex = email.indexOf('@');
  const recipientEmail = email.slice(0, atIndex) + '+' + runId + email.slice(atIndex);

  const client = new Client({ token });

  // Create the broadcast
  const createResponse = await client.broadcasts.createBroadcast({
    title: 'Test Broadcast',
    recipients: [{ email: recipientEmail }],
  });

  const broadcastId = createResponse.data.id;
  console.log(`Broadcast ID: ${broadcastId}`);

  // Fetch the broadcast status
  const fetchResponse = await client.broadcasts.fetchBroadcast(broadcastId);
  const status = fetchResponse.data.status;

  console.log(`Status: ${status}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
