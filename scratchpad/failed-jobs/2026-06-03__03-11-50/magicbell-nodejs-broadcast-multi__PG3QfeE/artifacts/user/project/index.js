const { Client } = require('magicbell-js/project-client');
const fs = require('fs');

async function main() {
  try {
    const client = new Client({
      token: process.env.MAGICBELL_PROJECT_TOKEN
    });

    const runId = process.env.ZEALT_RUN_ID;
    const magicbellEmail = process.env.MAGICBELL_EMAIL;
    
    const email1 = `${magicbellEmail}+recipient1-${runId}@gmail.com`;
    const email2 = `${magicbellEmail}+recipient2-${runId}@gmail.com`;

    const response = await client.broadcasts.createBroadcast({
      title: `Test Broadcast ${runId}`,
      recipients: [
        { email: email1 },
        { email: email2 }
      ],
      customAttributes: {
        custom_key: "custom_value"
      }
    });

    let broadcastId;
    if (response.data && response.data.id) {
      broadcastId = response.data.id;
    } else if (response.id) {
      broadcastId = response.id;
    }
    
    if (broadcastId) {
      fs.writeFileSync('/home/user/project/output.log', `Broadcast ID: ${broadcastId}\n`);
    } else {
      console.error("No ID found in response");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();