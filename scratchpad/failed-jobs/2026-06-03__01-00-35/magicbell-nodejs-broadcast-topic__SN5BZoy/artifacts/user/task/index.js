const fs = require('fs');
const path = require('path');

// 1. Require and override the SDK's internal userRequest schema BEFORE loading the client
const userModule = require('./node_modules/magicbell-js/dist/commonjs/project-client/services/common/user.js');
const { z } = require('zod');

// Use z.any() to prevent the SDK from stripping the custom 'topic' field on recipients
userModule.userRequest = z.any();

// 2. Load the ProjectClient from the magicbell-js SDK
const { Client: ProjectClient } = require('magicbell-js/project-client');

// 3. Read environment variables
const runId = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

if (!runId) {
  console.error("Error: ZEALT_RUN_ID environment variable is not defined.");
  process.exit(1);
}
if (!magicbellEmail) {
  console.error("Error: MAGICBELL_EMAIL environment variable is not defined.");
  process.exit(1);
}
if (!projectToken) {
  console.error("Error: MAGICBELL_PROJECT_TOKEN environment variable is not defined.");
  process.exit(1);
}

// 4. Initialize ProjectClient
const client = new ProjectClient({
  token: projectToken,
});

async function main() {
  const broadcastPayload = {
    title: `Topic Broadcast ${runId}`,
    topic: `announcements-${runId}`,
    recipients: [
      {
        email: `${magicbellEmail}+${runId}@gmail.com`
      },
      {
        topic: {
          subscribers: true
        }
      }
    ]
  };

  console.log("Sending broadcast with payload:", JSON.stringify(broadcastPayload, null, 2));

  try {
    const response = await client.broadcasts.createBroadcast(broadcastPayload);
    const responseData = response.data;

    console.log("Broadcast successfully created!");
    console.log("Response data:", JSON.stringify(responseData, null, 2));

    // Save the raw JSON response data to the required log file
    const logFilePath = '/home/user/task/output.log';
    fs.writeFileSync(logFilePath, JSON.stringify(responseData, null, 2), 'utf8');
    console.log(`Saved response data to ${logFilePath}`);
  } catch (error) {
    console.error("Error creating broadcast:", error);
    process.exit(1);
  }
}

main();
