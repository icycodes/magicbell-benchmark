const fs = require('fs');
const { Client } = require('magicbell-js/project-client');

const runId = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

if (!runId || !magicbellEmail || !projectToken) {
  throw new Error('Missing ZEALT_RUN_ID, MAGICBELL_EMAIL, or MAGICBELL_PROJECT_TOKEN environment variable.');
}

const [localPart, domain] = magicbellEmail.split('@');
if (!localPart || !domain) {
  throw new Error('MAGICBELL_EMAIL must be a valid email address.');
}

const recipientEmail = `${localPart}+list-events-js-${runId}@${domain}`;
const title = `Events Demo - ${runId}`;
const content = `Probing events stream for run ${runId}.`;

const client = new Client({ token: projectToken });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const eventMatches = (event, broadcastId) => {
  const serialized = JSON.stringify(event);
  if (broadcastId && serialized.includes(broadcastId)) {
    return true;
  }
  return serialized.includes(title);
};

const findEvent = async (broadcastId) => {
  const maxAttempts = 20;
  const delayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await client.events.listEvents({ limit: 100 });
    const events = response.data?.data || [];

    for (const event of events) {
      const detailedResponse = await client.events.fetchEvent(event.id);
      const detailedEvent = detailedResponse.data;
      if (detailedEvent && eventMatches(detailedEvent, broadcastId)) {
        return detailedEvent;
      }
    }

    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }

  throw new Error('Unable to locate matching event for broadcast.');
};

const main = async () => {
  const broadcastResponse = await client.broadcasts.createBroadcast({
    title,
    content,
    recipients: [{ email: recipientEmail }],
  });

  const broadcastId = broadcastResponse.data?.id;
  const matchedEvent = await findEvent(broadcastId);

  const outputLines = [`Event ID: ${matchedEvent.id}`, JSON.stringify(matchedEvent)];
  fs.writeFileSync('/home/user/myproject/output.log', outputLines.join('\n'));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
