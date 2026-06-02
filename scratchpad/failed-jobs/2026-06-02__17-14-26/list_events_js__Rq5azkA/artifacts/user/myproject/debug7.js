const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const events = await client.events.listEvents({ limit: 50 });
  
  for (const event of events.data.data) {
    if (JSON.stringify(event).includes("Test Broadcast")) {
      console.log("Found event:");
      console.log(JSON.stringify(event, null, 2));
    }
  }
}
debug().catch(console.error);
