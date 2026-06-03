'use strict';

const fs = require('fs');
const path = require('path');
const { Client: ProjectClient } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId) {
    throw new Error('ZEALT_RUN_ID environment variable is not set');
  }
  if (!magicbellEmail) {
    throw new Error('MAGICBELL_EMAIL environment variable is not set');
  }
  if (!projectToken) {
    throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not set');
  }

  // Initialize ProjectClient from magicbell-js SDK for authentication
  const client = new ProjectClient({
    token: projectToken,
  });

  const topic = `announcements-${runId}`;
  const title = `Topic Broadcast ${runId}`;

  // Construct the specific email recipient
  // e.g. REDACTED+zr-bgxi6u7@gmail.com from REDACTED@gmail.com
  const emailBase = magicbellEmail.replace('@gmail.com', '');
  const recipientEmail = `${emailBase}+${runId}@gmail.com`;

  console.log(`Creating broadcast:`);
  console.log(`  Topic: ${topic}`);
  console.log(`  Title: ${title}`);
  console.log(`  Recipient email: ${recipientEmail}`);
  console.log(`  Topic subscribers: ${topic}`);

  // Build the broadcast payload
  // Recipients include:
  // 1. A specific user identified by email
  // 2. All subscribers of the topic using the nested { topic: { subscribers: true } } format
  const broadcastPayload = {
    title,
    topic,
    recipients: [
      { email: recipientEmail },
      { topic: { subscribers: true } },
    ],
  };

  // The SDK's Zod schema strips unknown fields from the User model (e.g. the "topic" key
  // in recipients that represents topic subscribers), so we use the SDK's ProjectClient
  // for authentication and make the API call directly via fetch with the project token.
  const apiToken = client.config.token;
  const apiBaseUrl = 'https://api.magicbell.com/v2';

  const response = await fetch(`${apiBaseUrl}/broadcasts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify(broadcastPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }

  const responseData = await response.json();

  // Extract the .data property if present, otherwise use the full response
  const data = responseData.data !== undefined ? responseData.data : responseData;

  const jsonOutput = JSON.stringify(data);
  console.log('\nAPI response data:');
  console.log(jsonOutput);

  // Write the raw JSON of the .data property to the output log file
  const logFilePath = path.join(__dirname, 'output.log');
  fs.writeFileSync(logFilePath, jsonOutput, 'utf8');
  console.log(`\nOutput written to ${logFilePath}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
