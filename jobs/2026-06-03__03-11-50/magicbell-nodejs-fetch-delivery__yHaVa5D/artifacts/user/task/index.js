const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const originalEmail = process.env.MAGICBELL_EMAIL;
  
  if (!originalEmail || !runId) {
    console.error('Missing MAGICBELL_EMAIL or ZEALT_RUN_ID');
    process.exit(1);
  }

  const [localPart, domain] = originalEmail.split('@');
  const recipientEmail = `${localPart}+${runId}@${domain}`;

  const client = new Client({
    token: process.env.MAGICBELL_PROJECT_TOKEN
  });

  try {
    const broadcastBody = {
      title: 'Test Broadcast',
      recipients: [
        { email: recipientEmail }
      ]
    };

    const response = await client.broadcasts.createBroadcast(broadcastBody);
    const broadcast = response.data;
    
    if (!broadcast || !broadcast.id) {
      throw new Error('Broadcast ID not returned');
    }

    const broadcastId = broadcast.id;

    const fetchResponse = await client.broadcasts.fetchBroadcast(broadcastId);
    const fetchedBroadcast = fetchResponse.data;
    
    const status = fetchedBroadcast.status ? fetchedBroadcast.status.status : 'unknown';

    console.log(`Broadcast ID: ${broadcastId}`);
    console.log(`Status: ${status}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
