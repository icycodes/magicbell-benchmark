const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const eventsResponse = await client.events.listEvents({ limit: 1 });
  const eventId = eventsResponse.data?.data[0].id;
  
  const eventResponse = await client.events.fetchEvent(eventId);
  console.log(JSON.stringify(eventResponse.data, null, 2));
}
debug().catch(console.error);
