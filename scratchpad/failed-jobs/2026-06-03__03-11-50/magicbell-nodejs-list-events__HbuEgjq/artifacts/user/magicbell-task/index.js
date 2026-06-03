const { Client: ProjectClient } = require('magicbell-js/project-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const email = process.env.MAGICBELL_EMAIL;
  const token = process.env.MAGICBELL_PROJECT_TOKEN;

  const client = new ProjectClient({
    token: token,
  });

  const broadcastPayload = {
    title: `Test Event ${runId}`,
    recipients: [
      {
        email: `${email}+${runId}@gmail.com`
      }
    ]
  };

  try {
    const broadcastResponse = await client.broadcasts.createBroadcast(broadcastPayload);
    console.log('Broadcast created:', broadcastResponse.data);

    // Fetch events
    const eventsResponse = await client.events.listEvents({ limit: 5 });
    
    let eventsArray = eventsResponse.data;
    if (eventsResponse.data && Array.isArray(eventsResponse.data.data)) {
      eventsArray = eventsResponse.data.data;
    }
    
    fs.writeFileSync(path.join(__dirname, 'events.json'), JSON.stringify(eventsArray, null, 2));
    console.log('Events saved to events.json');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();