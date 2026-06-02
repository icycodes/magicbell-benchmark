const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const events = await client.events.listEvents({ limit: 5 });
  console.log(JSON.stringify(events.data.data, null, 2));
}
debug().catch(console.error);
