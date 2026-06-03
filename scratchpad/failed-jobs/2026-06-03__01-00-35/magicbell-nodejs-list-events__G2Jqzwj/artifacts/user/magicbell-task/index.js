const fs = require('fs');
const path = require('path');
const { Client: ProjectClient } = require('magicbell-js/project-client');

async function run() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId) {
    throw new Error('ZEALT_RUN_ID environment variable is not defined');
  }
  if (!magicbellEmail) {
    throw new Error('MAGICBELL_EMAIL environment variable is not defined');
  }
  if (!projectToken) {
    throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not defined');
  }

  // Initialize the MagicBell Node.js ProjectClient
  const client = new ProjectClient({
    token: projectToken,
  });

  const recipientEmail = `${magicbellEmail}+${runId}@gmail.com`;
  const title = `Test Event ${runId}`;

  console.log(`Creating broadcast notification to ${recipientEmail} with title "${title}"...`);

  // Create a broadcast notification
  const broadcastResponse = await client.broadcasts.createBroadcast({
    title: title,
    recipients: [
      {
        email: recipientEmail,
      },
    ],
  });

  console.log('Broadcast created successfully:', JSON.stringify(broadcastResponse.data, null, 2));

  // Wait a short duration to let the event propagate
  console.log('Waiting 2 seconds for event propagation...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('Fetching the most recent system events...');

  // Fetch the most recent system events with a limit of 5
  const eventsResponse = await client.events.listEvents({
    limit: 5,
  });

  console.log('Events fetched successfully.');

  const eventsData = eventsResponse.data && eventsResponse.data.data ? eventsResponse.data.data : [];

  console.log(`Writing ${eventsData.length} events to events.json...`);

  // Save the fetched events array to a file named events.json
  const outputPath = path.join(__dirname, 'events.json');
  fs.writeFileSync(outputPath, JSON.stringify(eventsData, null, 2), 'utf8');

  console.log(`Successfully wrote events to ${outputPath}`);
}

run().catch((error) => {
  console.error('Error executing task:', error);
  process.exit(1);
});
