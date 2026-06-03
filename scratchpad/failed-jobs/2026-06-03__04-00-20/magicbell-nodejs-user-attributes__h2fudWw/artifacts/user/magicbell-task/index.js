const { Client } = require('magicbell-js/project-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const email = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;

  if (!projectToken || !email || !runId) {
    console.error('Missing required environment variables: MAGICBELL_PROJECT_TOKEN, MAGICBELL_EMAIL, ZEALT_RUN_ID');
    process.exit(1);
  }

  // Insert +runId before the @ symbol in the email
  const atIndex = email.indexOf('@');
  const modifiedEmail = email.substring(0, atIndex) + '+' + runId + email.substring(atIndex);

  const externalId = `user-${runId}`;

  const client = new Client({
    token: projectToken,
  });

  const response = await client.users.saveUser({
    email: modifiedEmail,
    externalId: externalId,
    customAttributes: {
      plan: 'premium',
      task: `user-attributes-${runId}`,
    },
  });

  const userId = response.data.id;

  const outputPath = path.join('/home/user/magicbell-task', 'output.log');
  fs.writeFileSync(outputPath, `User ID: ${userId}\n`);

  console.log(`User ID: ${userId}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});