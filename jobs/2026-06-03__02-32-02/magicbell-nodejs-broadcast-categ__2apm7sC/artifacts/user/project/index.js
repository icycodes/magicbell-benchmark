const { Client } = require('magicbell-js/project-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const runId = process.env.ZEALT_RUN_ID;

  if (!magicbellEmail) {
    throw new Error('MAGICBELL_EMAIL environment variable is not set');
  }
  if (!projectToken) {
    throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not set');
  }
  if (!runId) {
    throw new Error('ZEALT_RUN_ID environment variable is not set');
  }

  // Strip any existing domain from MAGICBELL_EMAIL to build the plus-addressed email
  const emailLocalPart = magicbellEmail.includes('@')
    ? magicbellEmail.split('@')[0]
    : magicbellEmail;
  const recipientEmail = `${emailLocalPart}+${runId}@gmail.com`;

  const client = new Client({ token: projectToken });

  const response = await client.broadcasts.createBroadcast({
    title: `System Update Broadcast [${runId}]`,
    content: 'This is a system update notification.',
    category: 'system-update',
    recipients: [{ email: recipientEmail }],
  });

  const broadcastId = response.data && response.data.id;

  if (!broadcastId) {
    throw new Error('No Broadcast ID returned from the API');
  }

  const logLine = `Broadcast ID: ${broadcastId}\n`;
  const logPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(logPath, logLine);

  console.log(logLine.trim());
  console.log(`Recipient: ${recipientEmail}`);
  console.log(`Category: system-update`);
  console.log(`Log written to: ${logPath}`);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
