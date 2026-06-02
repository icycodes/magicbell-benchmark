const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const b = await client.broadcasts.fetchBroadcast("019e8959-524d-73b2-a3a8-c678a27db52f");
  console.log(JSON.stringify(b.data, null, 2));
}
debug().catch(console.error);
