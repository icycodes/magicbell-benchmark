const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const eventsResponse = await client.events.listEvents({ limit: 1, expand: ['payload'] });
  console.log(eventsResponse.data.data);
}
debug().catch(console.error);
