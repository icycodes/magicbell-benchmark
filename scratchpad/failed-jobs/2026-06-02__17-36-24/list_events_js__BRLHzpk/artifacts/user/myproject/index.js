'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('magicbell-js/project-client');

/**
 * Decode the timestamp (ms since epoch) embedded in a UUID v7.
 * UUID v7 packs a 48-bit Unix timestamp (ms) into the first 12 hex digits.
 */
function uuidv7ToMs(uuid) {
  const hex = uuid.replace(/-/g, '').slice(0, 12);
  return parseInt(hex, 16);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // 1. Read environment variables
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !magicbellEmail || !projectToken) {
    throw new Error(
      'Missing required environment variables: ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_PROJECT_TOKEN'
    );
  }

  // 2. Compose sub-addressed recipient email
  const atIndex = magicbellEmail.lastIndexOf('@');
  const localPart = magicbellEmail.slice(0, atIndex);
  const domain = magicbellEmail.slice(atIndex + 1);
  const recipientEmail = `${localPart}+list-events-js-${runId}@${domain}`;

  const broadcastTitle = `Events Demo - ${runId}`;
  const broadcastContent = `Probing events stream for run ${runId}.`;

  console.log(`Run ID:     ${runId}`);
  console.log(`Recipient:  ${recipientEmail}`);
  console.log(`Title:      ${broadcastTitle}`);

  // 3. Instantiate the project client
  const client = new Client({ token: projectToken });

  // 4. Send the broadcast
  console.log('\nSending broadcast...');
  const broadcastResponse = await client.broadcasts.createBroadcast({
    title: broadcastTitle,
    content: broadcastContent,
    recipients: [{ email: recipientEmail }],
  });

  const broadcast = broadcastResponse.data;
  const broadcastId = broadcast.id;
  const broadcastMs = uuidv7ToMs(broadcastId);

  console.log(`Broadcast created: ${broadcastId}`);
  console.log(`Broadcast time:    ${new Date(broadcastMs).toISOString()}`);

  // 5. Poll events until we find a delivery event whose notification_id was
  //    created within a short window after the broadcast.
  //    MagicBell uses UUID v7 throughout, so we can compare timestamps.
  const maxAttempts = 15;
  const delayMs = 2000;
  // Match events whose notification_id timestamp falls within [broadcastMs - 5s, broadcastMs + 30s]
  const windowLow = broadcastMs - 5000;
  const windowHigh = broadcastMs + 30000;

  let matchedEvent = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\nPolling events (attempt ${attempt}/${maxAttempts})...`);

    try {
      const eventsResponse = await client.events.listEvents({ limit: 50 });
      const eventsPage = eventsResponse.data;
      const items = eventsPage.data || [];

      console.log(`  Retrieved ${items.length} events`);

      for (const evt of items) {
        // Primary check: scan the full JSON string for the run-id title fragment
        // This catches any event type that embeds the broadcast title in any field.
        const evtStr = JSON.stringify(evt);
        if (evtStr.includes(broadcastTitle) || evtStr.includes(broadcastId)) {
          matchedEvent = evt;
          console.log(`  Matched by title/broadcast-id: ${evt.id}`);
          break;
        }

        // Secondary check: delivery events reference a notification_id; match by
        // the UUID v7 timestamp window of the broadcast.
        if (evt.context && evt.context.notification_id) {
          const notifMs = uuidv7ToMs(evt.context.notification_id);
          if (notifMs >= windowLow && notifMs <= windowHigh) {
            matchedEvent = evt;
            console.log(
              `  Matched by notification_id time window: ${evt.id}` +
              ` (notif ${evt.context.notification_id} at ${new Date(notifMs).toISOString()})`
            );
            break;
          }
        }
      }
    } catch (err) {
      console.warn(`  Error fetching events: ${err.message}`);
    }

    if (matchedEvent) break;

    if (attempt < maxAttempts) {
      console.log(`  Not found yet, waiting ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }

  if (!matchedEvent) {
    throw new Error(
      `Could not find a matching event for broadcast "${broadcastTitle}" after ${maxAttempts} attempts`
    );
  }

  // 6. Write output.log
  const outputPath = path.join(__dirname, 'output.log');
  const line1 = `Event ID: ${matchedEvent.id}`;
  const line2 = JSON.stringify(matchedEvent);
  fs.writeFileSync(outputPath, `${line1}\n${line2}\n`);

  console.log(`\nOutput written to: ${outputPath}`);
  console.log(line1);
}

main().catch((err) => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
