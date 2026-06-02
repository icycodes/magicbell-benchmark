const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const eventsResponse = await client.events.listEvents({ limit: 10 });
  const events = eventsResponse.data?.data || [];
  
  for (const event of events) {
    const fullEvent = await client.events.fetchEvent(event.id);
    const s = JSON.stringify(fullEvent.data);
    if (s.includes("Events Demo") || s.includes("Floating") || s.includes("Trigger JS")) {
      console.log(s);
    }
  }
}
debug().catch(console.error);
