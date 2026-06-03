const { Client } = require('magicbell-js/project-client');

const token = process.env.MAGICBELL_PROJECT_TOKEN;
const email = process.env.MAGICBELL_EMAIL;
const runId = process.env.ZEALT_RUN_ID;

if (!token || !email || !runId) {
  console.error('Missing required environment variables: MAGICBELL_PROJECT_TOKEN, MAGICBELL_EMAIL, ZEALT_RUN_ID');
  process.exit(1);
}

const client = new Client({ token });

async function main() {
  const response = await client.broadcasts.createBroadcast({
    title: 'Default Broadcast Title',
    content: 'Default broadcast content.',
    recipients: [
      { email: `${email}+${runId}@gmail.com` }
    ],
    overrides: {
      channels: {
        email: {
          title: `Custom Email Title ${runId}`,
          content: `Custom Email Content ${runId}`
        }
      }
    }
  });

  const broadcastId = response.data.id;
  console.log(`Broadcast ID: ${broadcastId}`);
}

main().catch((err) => {
  console.error('Error creating broadcast:', err);
  process.exit(1);
});
