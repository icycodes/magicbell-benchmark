const { Client } = require('magicbell-js/project-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const email = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !email || !projectToken) {
    console.error('Missing required environment variables: ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_PROJECT_TOKEN');
    process.exit(1);
  }

  const recipient1Email = `${email}+recipient1-${runId}@gmail.com`;
  const recipient2Email = `${email}+recipient2-${runId}@gmail.com`;

  const client = new Client({
    token: projectToken,
  });

  const broadcast = {
    title: `Test Broadcast ${runId}`,
    recipients: [
      { email: recipient1Email },
      { email: recipient2Email },
    ],
    customAttributes: {
      custom_key: 'custom_value',
    },
  };

  try {
    const response = await client.broadcasts.createBroadcast(broadcast);
    const broadcastId = response.data?.id;

    if (!broadcastId) {
      console.error('No broadcast ID returned from API');
      process.exit(1);
    }

    const logMessage = `Broadcast ID: ${broadcastId}`;
    const logPath = path.join('/home/user/project', 'output.log');
    fs.writeFileSync(logPath, logMessage + '\n');
    console.log(logMessage);
  } catch (err) {
    console.error('Error creating broadcast:', err);
    process.exit(1);
  }
}

main();