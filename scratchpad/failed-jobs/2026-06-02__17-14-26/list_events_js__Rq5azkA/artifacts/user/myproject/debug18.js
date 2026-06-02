const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const broadcastsResponse = await client.broadcasts.listBroadcasts({ limit: 5 });
  console.log(JSON.stringify(broadcastsResponse.data, null, 2));
}
debug().catch(console.error);
