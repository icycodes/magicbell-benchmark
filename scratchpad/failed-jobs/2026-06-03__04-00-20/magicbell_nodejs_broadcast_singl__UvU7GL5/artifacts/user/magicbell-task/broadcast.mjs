import { Client } from 'magicbell-js/project-client';
import fs from 'fs';

async function main() {
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const runId = process.env.ZEALT_RUN_ID;

  if (!magicbellEmail || !projectToken || !runId) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  // Extract local part from the email (part before @) for plus addressing
  const localPart = magicbellEmail.split('@')[0];
  const recipientEmail = `${localPart}+${runId}@gmail.com`;
  const broadcastTitle = `Test Broadcast ${runId}`;

  console.log(`Recipient email: ${recipientEmail}`);
  console.log(`Broadcast title: ${broadcastTitle}`);

  const client = new Client({ token: projectToken });

  const result = await client.broadcasts.createBroadcast({
    title: broadcastTitle,
    content: `This is a test broadcast for run ${runId}.`,
    recipients: [
      { email: recipientEmail }
    ]
  });

  const broadcastId = result.data?.id;
  console.log(`Broadcast ID: ${broadcastId}`);

  // Write broadcast ID to output log
  fs.writeFileSync('/home/user/magicbell-task/output.log', `Broadcast ID: ${broadcastId}\n`);

  console.log('Broadcast created successfully!');
}

main().catch((err) => {
  console.error('Error creating broadcast:', err);
  process.exit(1);
});