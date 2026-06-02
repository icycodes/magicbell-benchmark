const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const eventsResponse = await client.events.listEvents({ limit: 100 });
  const events = eventsResponse.data?.data || [];
  
  const types = new Set(events.map(e => e.type));
  console.log(Array.from(types));
}
debug().catch(console.error);
