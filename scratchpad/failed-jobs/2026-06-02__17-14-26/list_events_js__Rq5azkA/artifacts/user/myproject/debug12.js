const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const eventsResponse = await client.events.listEvents({ limit: 100 });
  const events = eventsResponse.data?.data || [];
  
  for (const event of events) {
    const s = JSON.stringify(event);
    if (s.includes("broadcast")) {
      console.log(s);
    }
  }
}
debug().catch(console.error);
