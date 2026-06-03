const { Client } = require('magicbell-js/project-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId) throw new Error('ZEALT_RUN_ID environment variable is not set');
  if (!magicbellEmail) throw new Error('MAGICBELL_EMAIL environment variable is not set');
  if (!projectToken) throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not set');

  const client = new Client({ token: projectToken });

  const broadcast = {
    title: `Test Broadcast ${runId}`,
    customAttributes: {
      custom_key: 'custom_value',
    },
    recipients: [
      { email: `${magicbellEmail}+recipient1-${runId}@gmail.com` },
      { email: `${magicbellEmail}+recipient2-${runId}@gmail.com` },
    ],
  };

  const response = await client.broadcasts.createBroadcast(broadcast);
  const broadcastId = response.data.id;

  const outputPath = path.join('/home/user/project', 'output.log');
  fs.writeFileSync(outputPath, `Broadcast ID: ${broadcastId}\n`);

  console.log(`Broadcast ID: ${broadcastId}`);
  console.log(`Output written to ${outputPath}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
