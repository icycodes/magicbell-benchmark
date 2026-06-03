const { Client } = require('magicbell-js/project-client');

async function main() {
  try {
    const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
    const magicbellEmail = process.env.MAGICBELL_EMAIL;
    const zealtRunId = process.env.ZEALT_RUN_ID;

    if (!projectToken) {
      console.error('Error: MAGICBELL_PROJECT_TOKEN environment variable is not set.');
      process.exit(1);
    }
    if (!magicbellEmail) {
      console.error('Error: MAGICBELL_EMAIL environment variable is not set.');
      process.exit(1);
    }
    if (!zealtRunId) {
      console.error('Error: ZEALT_RUN_ID environment variable is not set.');
      process.exit(1);
    }

    const [localPart, domain] = magicbellEmail.split('@');
    if (!localPart || !domain) {
      console.error('Error: MAGICBELL_EMAIL is not a valid email address.');
      process.exit(1);
    }

    const recipientEmail = `${localPart}+${zealtRunId}@${domain}`;

    const client = new Client({
      token: projectToken,
    });

    // Create the broadcast
    const createResponse = await client.broadcasts.createBroadcast({
      title: 'Broadcast Delivery Status Test',
      content: `Test broadcast for run ${zealtRunId}`,
      recipients: [
        {
          email: recipientEmail,
        },
      ],
    });

    const broadcastId = createResponse.data?.id;
    if (!broadcastId) {
      console.error('Error: Failed to retrieve broadcast ID from creation response.');
      process.exit(1);
    }

    // Fetch the broadcast details to get the delivery status
    const fetchResponse = await client.broadcasts.fetchBroadcast(broadcastId);
    const status = fetchResponse.data?.status?.status;

    if (!status) {
      console.error('Error: Failed to retrieve status from fetch response.');
      process.exit(1);
    }

    console.log(`Broadcast ID: ${broadcastId}`);
    console.log(`Status: ${status}`);
  } catch (error) {
    console.error('An error occurred:', error.message || error);
    process.exit(1);
  }
}

main();
