const { Client } = require('magicbell-js/project-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId) throw new Error('ZEALT_RUN_ID environment variable is not set');
  if (!magicbellEmail) throw new Error('MAGICBELL_EMAIL environment variable is not set');
  if (!projectToken) throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not set');

  // Insert +${runId} before the @ symbol
  const atIndex = magicbellEmail.indexOf('@');
  if (atIndex === -1) throw new Error('MAGICBELL_EMAIL is not a valid email address');
  const email = `${magicbellEmail.slice(0, atIndex)}+${runId}${magicbellEmail.slice(atIndex)}`;

  const externalId = `user-${runId}`;

  const client = new Client({ token: projectToken });

  console.log(`Saving user: email=${email}, externalId=${externalId}`);

  const response = await client.users.saveUser({
    email,
    externalId,
    customAttributes: {
      plan: 'premium',
      task: `user-attributes-${runId}`,
    },
  });

  const userId = response.data.id;
  console.log(`User saved. ID: ${userId}`);

  const logLine = `User ID: ${userId}\n`;
  const logPath = path.join('/home/user/magicbell-task', 'output.log');
  fs.writeFileSync(logPath, logLine, 'utf8');
  console.log(`Log written to ${logPath}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
