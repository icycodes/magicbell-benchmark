const fs = require('fs');
const path = require('path');
const { Client } = require('magicbell-js/project-client');

async function run() {
  try {
    const magicbellProjectToken = process.env.MAGICBELL_PROJECT_TOKEN;
    const zealtRunId = process.env.ZEALT_RUN_ID;
    const magicbellEmail = process.env.MAGICBELL_EMAIL;

    if (!magicbellProjectToken) {
      throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not defined.');
    }
    if (!zealtRunId) {
      throw new Error('ZEALT_RUN_ID environment variable is not defined.');
    }
    if (!magicbellEmail) {
      throw new Error('MAGICBELL_EMAIL environment variable is not defined.');
    }

    const client = new Client({
      token: magicbellProjectToken,
    });

    const recipientEmail = `${magicbellEmail}+${zealtRunId}@gmail.com`;

    const payload = {
      title: 'Default Broadcast Title',
      content: 'Default Broadcast Content',
      recipients: [
        {
          email: recipientEmail,
        },
      ],
      overrides: {
        channels: {
          email: {
            title: `Custom Email Title ${zealtRunId}`,
            content: `Custom Email Content ${zealtRunId}`,
          },
        },
      },
    };

    const response = await client.broadcasts.createBroadcast(payload);

    if (!response.data || !response.data.id) {
      throw new Error('Failed to retrieve broadcast ID from response.');
    }

    const broadcastId = response.data.id;
    const outputMessage = `Broadcast ID: ${broadcastId}`;

    // Print to standard output
    console.log(outputMessage);

    // Write to output.log
    const logPath = path.join(__dirname, 'output.log');
    fs.writeFileSync(logPath, outputMessage + '\n', 'utf8');

  } catch (error) {
    console.error('Error sending broadcast:', error);
    process.exit(1);
  }
}

run();
