const { Client } = require('magicbell-js/project-client');
const fs = require('fs');

const token = process.env.MAGICBELL_PROJECT_TOKEN;
const email = process.env.MAGICBELL_EMAIL;
const runId = process.env.ZEALT_RUN_ID;

const client = new Client({ token });

async function main() {
  // Create a broadcast notification to generate a system event
  await client.broadcasts.createBroadcast({
    title: `Test Event ${runId}`,
    recipients: [{ email: `${email}+${runId}@gmail.com` }],
  });

  // Fetch the most recent system events with a limit of 5
  const eventsResponse = await client.events.listEvents({ limit: 5 });

  const events = eventsResponse.data?.data ?? [];

  fs.writeFileSync('events.json', JSON.stringify(events, null, 2));

  console.log(`Fetched ${events.length} event(s) and saved to events.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
