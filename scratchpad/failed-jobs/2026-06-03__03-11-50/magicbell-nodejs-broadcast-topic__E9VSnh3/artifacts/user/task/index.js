const fs = require('fs');
const path = require('path');
// The prompt asks to use "ProjectClient". In the SDK, the class is named "Client" 
// and exported from the "project-client" subpath. We alias it here.
const { Client: ProjectClient } = require('magicbell-js/project-client');

// Monkey patch the SDK's schema to prevent it from stripping the nested topic object
const broadcastModels = require(path.join(__dirname, 'node_modules/magicbell-js/dist/commonjs/project-client/services/broadcasts/models/broadcast.js'));
broadcastModels.broadcastRequest = {
  parse: (data) => data
};
broadcastModels.broadcastResponse = {
  parse: (data) => data
};

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const emailBase = process.env.MAGICBELL_EMAIL;
  
  if (!runId || !emailBase) {
    console.error("Missing ZEALT_RUN_ID or MAGICBELL_EMAIL environment variables.");
    process.exit(1);
  }

  const client = new ProjectClient({
    token: process.env.MAGICBELL_PROJECT_TOKEN
  });

  try {
    const response = await client.broadcasts.createBroadcast({
      title: `Topic Broadcast ${runId}`,
      topic: `announcements-${runId}`,
      recipients: [
        { email: `${emailBase}+${runId}@gmail.com` },
        { topic: { subscribers: true } }
      ]
    });
    
    // We can just stringify response.data since we monkey-patched the response parser too
    const output = JSON.stringify(response.data);
    console.log(output);
    fs.writeFileSync('/home/user/task/output.log', output + '\n');
  } catch (err) {
    console.error("Error creating broadcast:", err.message);
    if (err.response) {
      console.error(err.response.data);
    }
    process.exit(1);
  }
}

main();