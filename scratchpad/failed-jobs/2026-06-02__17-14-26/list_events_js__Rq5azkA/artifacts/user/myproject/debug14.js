const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const eventsResponse = await client.events.listEvents({ limit: 50 });
  const events = eventsResponse.data?.data || [];
  
  for (const event of events) {
    if (event.payload || event.data) {
      console.log("Found payload or data in listEvents!");
      break;
    }
  }
}
debug().catch(console.error);
