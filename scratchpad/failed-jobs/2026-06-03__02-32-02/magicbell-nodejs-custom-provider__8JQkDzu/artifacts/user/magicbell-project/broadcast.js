'use strict';

const { ProjectClient } = require('magicbell');
const fs = require('fs');
const path = require('path');

async function main() {
  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;

  if (!token) {
    throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is required');
  }
  if (!runId) {
    throw new Error('ZEALT_RUN_ID environment variable is required');
  }
  if (!magicbellEmail) {
    throw new Error('MAGICBELL_EMAIL environment variable is required');
  }

  // Construct recipient email: {MAGICBELL_EMAIL}+${run-id}@gmail.com
  // e.g. user@gmail.com -> user+zr-8jqkdzu@gmail.com
  const [localPart] = magicbellEmail.split('@');
  const recipientEmail = `${localPart}+${runId}@gmail.com`;

  console.log(`Sending broadcast to: ${recipientEmail}`);

  // Initialize the ProjectClient using the project token
  const client = new ProjectClient({ token });

  // Create the broadcast with overrides that disable the email channel
  const broadcast = await client.broadcasts.create({
    title: 'Test Broadcast',
    content: 'This is a test broadcast sent via MagicBell Node.js SDK with email channel disabled.',
    recipients: [
      { email: recipientEmail },
    ],
    overrides: {
      channels: {
        email: {
          disabled: true,
        },
      },
    },
  });

  const broadcastId = broadcast.id;
  console.log(`Broadcast created successfully. ID: ${broadcastId}`);

  // Write result to output.log
  const logPath = path.join(__dirname, 'output.log');
  const logContent = `Broadcast ID: ${broadcastId}\n`;
  fs.writeFileSync(logPath, logContent, 'utf8');
  console.log(`Broadcast ID written to ${logPath}`);
}

main().catch((err) => {
  console.error('Error creating broadcast:', err);
  process.exit(1);
});
