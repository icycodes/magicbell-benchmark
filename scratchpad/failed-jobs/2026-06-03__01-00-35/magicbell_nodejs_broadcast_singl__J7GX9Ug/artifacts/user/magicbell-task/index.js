const { Client } = require('magicbell-js/project-client');
const fs = require('fs');
const path = require('path');

async function run() {
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const zealtRunId = process.env.ZEALT_RUN_ID;
  const magicbellProjectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!magicbellEmail || !zealtRunId || !magicbellProjectToken) {
    console.error('Missing required environment variables: MAGICBELL_EMAIL, ZEALT_RUN_ID, MAGICBELL_PROJECT_TOKEN');
    process.exit(1);
  }

  const recipientEmail = `${magicbellEmail}+${zealtRunId}@gmail.com`;
  const title = `Test Broadcast ${zealtRunId}`;
  const content = `This is a test notification content for run ${zealtRunId}.`;

  const client = new Client({
    token: magicbellProjectToken,
  });

  try {
    const response = await client.broadcasts.createBroadcast({
      title: title,
      content: content,
      recipients: [
        {
          email: recipientEmail,
        },
      ],
    });

    const broadcast = response.data;
    console.log('Broadcast response data:', broadcast);
    if (!broadcast || !broadcast.id) {
      throw new Error('Broadcast ID is missing from response');
    }

    const broadcastId = broadcast.id;
    const logFilePath = path.join(__dirname, 'output.log');
    fs.writeFileSync(logFilePath, `Broadcast ID: ${broadcastId}\n`);
    console.log(`Logged Broadcast ID: ${broadcastId} to ${logFilePath}`);
  } catch (error) {
    console.error('Error triggering broadcast:', error);
    process.exit(1);
  }
}

run();
