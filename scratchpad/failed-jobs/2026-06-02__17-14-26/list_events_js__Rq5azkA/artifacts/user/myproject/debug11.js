const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const eventsResponse = await client.events.listEvents({ limit: 100 });
  const events = eventsResponse.data?.data || [];
  
  for (const event of events) {
    if (event.data) {
      console.log(JSON.stringify(event, null, 2));
      break;
    }
  }
}
debug().catch(console.error);
