const { Client: ProjectClient } = require('magicbell-js/project-client');
const fs = require('fs');
const path = require('path');

async function run() {
  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;

  if (!token || !magicbellEmail || !runId) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  // Extract email prefix if it contains '@'
  let emailPrefix = magicbellEmail;
  if (emailPrefix.includes('@')) {
    emailPrefix = emailPrefix.split('@')[0];
  }
  const recipientEmail = `${emailPrefix}+${runId}@gmail.com`;

  console.log(`Recipient Email: ${recipientEmail}`);

  const client = new ProjectClient({ token });

  const broadcastPayload = {
    title: `System Update for ${runId}`,
    content: `This is a system update broadcast with run ID: ${runId}`,
    category: 'system-update',
    recipients: [
      {
        email: recipientEmail,
      },
    ],
  };

  try {
    const response = await client.broadcasts.createBroadcast(broadcastPayload);
    const broadcastId = response.data && response.data.id;

    if (!broadcastId) {
      throw new Error('No broadcast ID returned from MagicBell API');
    }

    console.log(`Broadcast created successfully with ID: ${broadcastId}`);

    const logContent = `Broadcast ID: ${broadcastId}\n`;
    fs.writeFileSync(path.join(__dirname, 'output.log'), logContent);
    console.log(`Saved to output.log`);
  } catch (error) {
    console.error('Error creating broadcast:', error);
    process.exit(1);
  }
}

run();
