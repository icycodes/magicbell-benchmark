'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('magicbell-js/project-client');

const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL;
const MAGICBELL_PROJECT_TOKEN = process.env.MAGICBELL_PROJECT_TOKEN;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;

if (!MAGICBELL_EMAIL || !MAGICBELL_PROJECT_TOKEN || !ZEALT_RUN_ID) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const recipientEmail = `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`;
const broadcastTitle = `Test Broadcast ${ZEALT_RUN_ID}`;

const client = new Client({ token: MAGICBELL_PROJECT_TOKEN });

async function main() {
  const response = await client.broadcasts.createBroadcast({
    title: broadcastTitle,
    content: 'This is a test broadcast sent via the MagicBell Node.js SDK.',
    recipients: [{ email: recipientEmail }],
  });

  const broadcastId = response.data.id;
  console.log(`Broadcast ID: ${broadcastId}`);

  const outputPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(outputPath, `Broadcast ID: ${broadcastId}\n`);
  console.log(`Output written to ${outputPath}`);
}

main().catch((err) => {
  console.error('Error creating broadcast:', err);
  process.exit(1);
});
