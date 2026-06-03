const fs = require('fs');
const path = require('path');
const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId) {
    console.error('Error: ZEALT_RUN_ID environment variable is not defined.');
    process.exit(1);
  }
  if (!magicbellEmail) {
    console.error('Error: MAGICBELL_EMAIL environment variable is not defined.');
    process.exit(1);
  }
  if (!projectToken) {
    console.error('Error: MAGICBELL_PROJECT_TOKEN environment variable is not defined.');
    process.exit(1);
  }

  // Initialize the client
  const client = new Client({
    token: projectToken,
  });

  const title = `Test Broadcast ${runId}`;
  const recipient1 = `${magicbellEmail}+recipient1-${runId}@gmail.com`;
  const recipient2 = `${magicbellEmail}+recipient2-${runId}@gmail.com`;

  console.log(`Sending broadcast: "${title}"`);
  console.log(`Recipients: ${recipient1}, ${recipient2}`);

  try {
    const response = await client.broadcasts.createBroadcast({
      title: title,
      recipients: [
        { email: recipient1 },
        { email: recipient2 },
      ],
      customAttributes: {
        custom_key: 'custom_value',
      },
    });

    const broadcastId = response.data?.id;
    if (!broadcastId) {
      throw new Error('No broadcast ID returned from the MagicBell API.');
    }

    console.log(`Broadcast created successfully! ID: ${broadcastId}`);

    // Write the resulting broadcast ID to /home/user/project/output.log
    const logDir = '/home/user/project';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFilePath = path.join(logDir, 'output.log');
    fs.writeFileSync(logFilePath, `Broadcast ID: ${broadcastId}\n`);
    console.log(`Broadcast ID logged to ${logFilePath}`);
  } catch (error) {
    console.error('Failed to create broadcast:', error);
    process.exit(1);
  }
}

main();
