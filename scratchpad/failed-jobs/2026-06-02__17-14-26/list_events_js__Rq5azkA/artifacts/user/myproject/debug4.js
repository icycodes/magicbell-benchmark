const { Client } = require('magicbell-js/project-client');

async function debug() {
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  const response = await client.broadcasts.createBroadcast({
    title: "Test Broadcast",
    content: "Test Content",
    recipients: [{ email: "test@example.com" }]
  });
  console.log(response.data);
}
debug().catch(console.error);
