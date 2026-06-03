const { Client } = require('magicbell-js/project-client');

async function main() {
  const zealtRunId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  // Construct recipient email by inserting +ZEALT_RUN_ID before the @
  const [localPart, domain] = magicbellEmail.split('@');
  const recipientEmail = `${localPart}+${zealtRunId}@${domain}`;

  // Initialize the project client
  const client = new Client({
    token: projectToken,
  });

  // Create a broadcast
  const createResponse = await client.broadcasts.createBroadcast({
    title: 'Test Broadcast',
    recipients: [
      {
        email: recipientEmail,
      },
    ],
  });

  const broadcastId = createResponse.data.id;
  console.log(`Broadcast ID: ${broadcastId}`);

  // Fetch the broadcast to get its status
  const fetchResponse = await client.broadcasts.fetchBroadcast(broadcastId);
  const status = fetchResponse.data.status.status;
  console.log(`Status: ${status}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});