const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  let after = null;
  let found = false;
  
  for (let i = 0; i < 10; i++) {
    const eventsResponse = await client.events.listEvents({ limit: 100, starting_after: after });
    const events = eventsResponse.data?.data || [];
    if (events.length === 0) break;
    
    for (const event of events) {
      const full = await client.events.fetchEvent(event.id);
      const s = JSON.stringify(full.data);
      if (s.includes("Test Broadcast")) {
        console.log("Found Test Broadcast in event:", event.id);
        console.log(s);
        found = true;
      }
    }
    if (found) break;
    after = eventsResponse.data.links.next ? eventsResponse.data.links.next.split('starting_after=')[1] : null;
    if (!after) break;
  }
}
debug().catch(console.error);
