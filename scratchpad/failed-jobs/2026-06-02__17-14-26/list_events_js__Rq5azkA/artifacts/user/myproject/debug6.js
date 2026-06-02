const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const events = await client.events.listEvents({ limit: 50 });
  const broadcastId = "019e8959-7db3-7c87-842c-e7e672340ed5"; // from previous run
  
  for (const event of events.data.data) {
    if (JSON.stringify(event).includes(broadcastId)) {
      console.log("Found event for broadcast:");
      console.log(JSON.stringify(event, null, 2));
    }
    if (event.type.includes('broadcast')) {
      console.log("Found broadcast event:");
      console.log(JSON.stringify(event, null, 2));
    }
  }
}
debug().catch(console.error);
