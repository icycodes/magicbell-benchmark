const fs = require('fs');
const path = require('path');
const { Client } = require('magicbell-js/project-client');

async function main() {
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const magicbellProjectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const runId = process.env.ZEALT_RUN_ID;

  if (!magicbellEmail || !magicbellProjectToken || !runId) {
    console.error('Missing required environment variables: MAGICBELL_EMAIL, MAGICBELL_PROJECT_TOKEN, ZEALT_RUN_ID');
    process.exit(1);
  }

  const recipientEmail = `${magicbellEmail}+${runId}@gmail.com`;

  const client = new Client({
    token: magicbellProjectToken,
  });

  const broadcast = await client.broadcasts.createBroadcast({
    title: `System Update - Run ${runId}`,
    content: `This is a system update notification for run ${runId}.`,
    category: 'system-update',
    recipients: [
      { email: recipientEmail },
    ],
  });

  const broadcastId = broadcast.data?.id;

  if (!broadcastId) {
    console.error('Broadcast ID not found in response');
    console.error('Response:', JSON.stringify(broadcast, null, 2));
    process.exit(1);
  }

  const logContent = `Broadcast ID: ${broadcastId}`;
  const logPath = path.join('/home/user/project', 'output.log');
  fs.writeFileSync(logPath, logContent + '\n');

  console.log(logContent);
}

main().catch((err) => {
  console.error('Error creating broadcast:', err);
  process.exit(1);
});