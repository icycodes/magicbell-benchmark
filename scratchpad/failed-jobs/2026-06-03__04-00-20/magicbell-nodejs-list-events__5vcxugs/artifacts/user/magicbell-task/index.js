const fs = require('fs');
const { Client } = require('magicbell-js/project-client');

const runId = process.env.ZEALT_RUN_ID;
const email = process.env.MAGICBELL_EMAIL;
const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

async function main() {
  // Initialize the MagicBell ProjectClient
  const client = new Client({
    token: projectToken,
  });

  // Create a broadcast notification
  const recipientEmail = `${email}+${runId}@gmail.com`;
  console.log(`Creating broadcast to: ${recipientEmail}`);

  await client.broadcasts.createBroadcast({
    title: `Test Event ${runId}`,
    recipients: [{ email: recipientEmail }],
  });

  console.log('Broadcast created successfully');

  // Fetch the most recent system events with limit of 5
  const eventsResponse = await client.events.listEvents({ limit: 5 });

  // Write the data array from the events response to events.json
  const eventsData = eventsResponse.data?.data || eventsResponse.data || [];
  fs.writeFileSync('events.json', JSON.stringify(eventsData, null, 2));
  console.log(`Saved ${Array.isArray(eventsData) ? eventsData.length : 0} events to events.json`);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});