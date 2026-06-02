const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  let after = null;
  
  for (let i = 0; i < 10; i++) {
    const eventsResponse = await client.events.listEvents({ limit: 100, starting_after: after });
    const events = eventsResponse.data?.data || [];
    if (events.length === 0) break;
    
    for (const event of events) {
      if (event.id === "019e8959-c0cc-79c1-b824-e724db12ee7b") {
        console.log("From listEvents:");
        console.log(JSON.stringify(event, null, 2));
      }
    }
    after = eventsResponse.data.links.next ? eventsResponse.data.links.next.split('starting_after=')[1] : null;
    if (!after) break;
  }
}
debug().catch(console.error);
