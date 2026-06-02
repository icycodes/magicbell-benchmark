const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const events = await client.events.listEvents({ limit: 1 });
  console.log(events);
}
debug().catch(console.error);
