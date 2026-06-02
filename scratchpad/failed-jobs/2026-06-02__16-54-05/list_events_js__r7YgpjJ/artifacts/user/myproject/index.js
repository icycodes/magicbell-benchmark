const fs = require('fs');
const path = require('path');
const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !magicbellEmail || !projectToken) {
    console.error("Error: Missing ZEALT_RUN_ID, MAGICBELL_EMAIL, or MAGICBELL_PROJECT_TOKEN in environment.");
    process.exit(1);
  }

  // Record the start time (with a 5-second buffer to account for any minor clock skew)
  const startTime = new Date(Date.now() - 5000);

  // Compose recipient email
  const [local, domain] = magicbellEmail.split('@');
  const recipientEmail = `${local}+list-events-js-${runId}@${domain}`;

  console.log(`Run ID: ${runId}`);
  console.log(`Recipient Email: ${recipientEmail}`);

  // Initialize client
  const client = new Client({ token: projectToken });

  const title = `Events Demo - ${runId}`;
  const content = `Probing events stream for run ${runId}.`;

  console.log("Sending broadcast...");
  const broadcastResponse = await client.broadcasts.createBroadcast({
    title,
    content,
    recipients: [
      { email: recipientEmail }
    ]
  });

  const broadcast = broadcastResponse.data;
  if (!broadcast) {
    throw new Error("Failed to create broadcast: No data returned in response.");
  }
  const broadcastId = broadcast.id;
  console.log(`Broadcast created successfully. ID: ${broadcastId}`);

  // Polling loop
  console.log("Polling events stream for the broadcast event...");
  const maxRetries = 25;
  const retryIntervalMs = 2000;
  let matchedEvent = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Attempt ${attempt}/${maxRetries}...`);
    try {
      const eventsResponse = await client.events.listEvents({ limit: 50 });
      const eventsList = eventsResponse.data?.data || [];

      console.log(`Fetched list of ${eventsList.length} events. Fetching full details to find match...`);

      // Fetch full details of each event to inspect the payload
      const fullEvents = await Promise.all(
        eventsList.map(async (e) => {
          try {
            const res = await client.events.fetchEvent(e.id);
            return res.data;
          } catch (err) {
            console.error(`Failed to fetch event ${e.id}:`, err.message);
            return e; // Fallback to summary
          }
        })
      );

      // Find matched event
      const needle = `Events Demo - ${runId}`;
      matchedEvent = fullEvents.find(evt => {
        // Filter out older events
        const eventTime = new Date(evt.timestamp);
        if (eventTime < startTime) {
          return false;
        }

        const str = JSON.stringify(evt);
        const matchesTitle = str.includes(needle);
        const matchesBroadcastId = broadcastId && str.includes(broadcastId);
        return matchesTitle || matchesBroadcastId;
      });

      if (matchedEvent) {
        console.log(`Found matching event! ID: ${matchedEvent.id}`);
        break;
      }
    } catch (err) {
      console.error(`Error fetching events on attempt ${attempt}:`, err.message);
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
    }
  }

  if (!matchedEvent) {
    throw new Error(`Could not find event referencing the broadcast after ${maxRetries} attempts.`);
  }

  // Write to output.log
  const logPath = '/home/user/myproject/output.log';
  const logContent = `Event ID: ${matchedEvent.id}\n${JSON.stringify(matchedEvent)}\n`;
  fs.writeFileSync(logPath, logContent, 'utf8');
  console.log(`Successfully wrote output to ${logPath}`);
}

main().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
