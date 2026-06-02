'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId) throw new Error('Missing environment variable: ZEALT_RUN_ID');
  if (!magicbellEmail) throw new Error('Missing environment variable: MAGICBELL_EMAIL');
  if (!projectToken) throw new Error('Missing environment variable: MAGICBELL_PROJECT_TOKEN');

  // Build plus-addressed email: <local>+save-user-js-<run-id>@<domain>
  const atIndex = magicbellEmail.indexOf('@');
  if (atIndex === -1) throw new Error('MAGICBELL_EMAIL does not contain "@"');
  const local = magicbellEmail.slice(0, atIndex);
  const domain = magicbellEmail.slice(atIndex + 1);
  const recipientEmail = `${local}+save-user-js-${runId}@${domain}`;

  // Initialize the Project Client
  const client = new Client({ token: projectToken });

  // Upsert the user
  const response = await client.users.saveUser({
    externalId: `user-${runId}`,
    email: recipientEmail,
    firstName: 'Save',
    lastName: `User-${runId}`,
  });

  const userId = response.data.id;
  if (!userId) throw new Error('No user ID returned from saveUser response');

  // Write output log
  const outputPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(outputPath, `User ID: ${userId}\n`, 'utf8');

  console.log(`User ID: ${userId}`);
  console.log(`Output written to: ${outputPath}`);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
