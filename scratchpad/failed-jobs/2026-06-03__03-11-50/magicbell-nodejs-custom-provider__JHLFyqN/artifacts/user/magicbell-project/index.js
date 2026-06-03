const fs = require('fs');
const { Client } = require('magicbell-js/project-client');
const broadcastModels = require('/home/user/magicbell-project/node_modules/magicbell-js/dist/commonjs/project-client/services/broadcasts/models/broadcast.js');
const { z } = require('zod');

// Monkey-patch to bypass Zod's "strip" policy for channels.email.disable
broadcastModels.broadcastRequest = z.any();

async function run() {
  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;
  
  // Requirement: The broadcast must be sent to a single recipient with the email {MAGICBELL_EMAIL}+${run-id}@gmail.com
  // We will literally concatenate as requested, or if they meant proper plus addressing, we'll provide both.
  // Actually, let's just do exactly what's requested:
  const recipientEmail = `${magicbellEmail}+${runId}@gmail.com`;

  const client = new Client({ token });

  try {
    const { data } = await client.broadcasts.createBroadcast({
      title: "Test Broadcast",
      content: "This is a test broadcast",
      recipients: [{ email: recipientEmail }],
      overrides: {
        channels: {
          email: {
            disable: true
          }
        }
      }
    });

    const output = `Broadcast ID: ${data.id}\n`;
    fs.writeFileSync('/home/user/magicbell-project/output.log', output);
    console.log("Successfully created broadcast and wrote to output.log");
  } catch (error) {
    console.error("Failed to create broadcast:", error.response ? JSON.stringify(error.response.data) : error.message);
    process.exit(1);
  }
}

run();