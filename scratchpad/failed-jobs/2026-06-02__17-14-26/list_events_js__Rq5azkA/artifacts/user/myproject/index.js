const { Client } = require('magicbell-js/project-client');
const fs = require('fs');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const email = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !email || !projectToken) {
    console.error("Missing environment variables");
    process.exit(1);
  }

  const [local, domain] = email.split('@');
  const recipientEmail = `${local}+list-events-js-${runId}@${domain}`;
  const title = `Events Demo - ${runId}`;

  const client = new Client({ token: projectToken });

  // 2. Send broadcast
  const broadcastResponse = await client.broadcasts.createBroadcast({
    title: title,
    content: `Probing events stream for run ${runId}.`,
    recipients: [{ email: recipientEmail }]
  });

  const broadcastId = broadcastResponse.data?.id;
  console.log("Broadcast created:", broadcastId);

  // 3. Poll events
  let matchedEvent = null;
  const checkedEvents = new Set();
  
  for (let i = 0; i < 20; i++) {
    console.log(`Polling events... Attempt ${i + 1}`);
    const eventsResponse = await client.events.listEvents({ limit: 50 });
    const events = eventsResponse.data?.data || [];
    
    // Check if any event references the broadcast
    for (const eventSummary of events) {
      if (checkedEvents.has(eventSummary.id)) continue;
      checkedEvents.add(eventSummary.id);
      
      const summaryStr = JSON.stringify(eventSummary);
      if (summaryStr.includes(title) || (broadcastId && summaryStr.includes(broadcastId))) {
        matchedEvent = eventSummary;
        break;
      }
      
      try {
        const fullEventRes = await client.events.fetchEvent(eventSummary.id);
        const fullEvent = fullEventRes.data;
        const eventStr = JSON.stringify(fullEvent);
        if (eventStr.includes(title) || (broadcastId && eventStr.includes(broadcastId))) {
          matchedEvent = fullEvent;
          break;
        }
      } catch (err) {
        // ignore fetch errors
      }
    }

    if (matchedEvent) {
      break;
    }

    // Wait 2 seconds before retrying
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (matchedEvent) {
    console.log("Matched event found:", matchedEvent.id);
    const logContent = `Event ID: ${matchedEvent.id}\n${JSON.stringify(matchedEvent)}\n`;
    fs.writeFileSync('/home/user/myproject/output.log', logContent);
  } else {
    console.error("No matched event found");
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
