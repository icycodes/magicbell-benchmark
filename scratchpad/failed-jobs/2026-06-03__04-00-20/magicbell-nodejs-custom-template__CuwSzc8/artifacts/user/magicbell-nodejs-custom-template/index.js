const { Client } = require('magicbell-js/project-client');

async function main() {
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const zealtRunId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;

  const recipientEmail = `${magicbellEmail}+${zealtRunId}@gmail.com`;

  const client = new Client({ token: projectToken });

  const broadcast = {
    title: 'Default Broadcast Title',
    content: 'Default Broadcast Content',
    recipients: [
      { email: recipientEmail },
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

  const response = await client.broadcasts.createBroadcast(broadcast);
  const broadcastId = response.data.id;
  console.log(`Broadcast ID: ${broadcastId}`);
}

main().catch((err) => {
  console.error('Error creating broadcast:', err);
  process.exit(1);
});