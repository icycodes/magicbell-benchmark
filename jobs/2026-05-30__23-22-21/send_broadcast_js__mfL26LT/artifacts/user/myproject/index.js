const fs = require('fs');
const path = require('path');
const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const gmailUserName = process.env.GMAIL_USER_NAME;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !gmailUserName || !projectToken) {
    console.error('Missing required environment variables: ZEALT_RUN_ID, GMAIL_USER_NAME, MAGICBELL_PROJECT_TOKEN');
    process.exit(1);
  }

  const externalId = `user_${runId}`;
  const email = `${gmailUserName}+${runId}@gmail.com`;

  // Initialize the project client
  const client = new Client({
    token: projectToken,
  });

  // Step 1: Create/upsert user
  console.log(`Creating/upserting user with externalId: ${externalId}, email: ${email}`);
  const userResponse = await client.users.saveUser({
    externalId: externalId,
    email: email,
    firstName: 'Test',
    lastName: 'User',
  });
  console.log('User created/updated:', userResponse.data);

  // Step 2: Send broadcast notification
  console.log(`Sending broadcast notification with title: Welcome to MagicBell ${runId}!`);
  const broadcastResponse = await client.broadcasts.createBroadcast({
    title: `Welcome to MagicBell ${runId}!`,
    content: `This is a test notification for run ${runId}.`,
    recipients: [
      {
        externalId: externalId,
      },
    ],
  });

  const broadcastId = broadcastResponse.data.id;
  console.log('Broadcast created with ID:', broadcastId);

  // Step 3: Write broadcast ID to output.log
  const outputPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(outputPath, `Broadcast ID: ${broadcastId}\n`);
  console.log(`Broadcast ID written to ${outputPath}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});