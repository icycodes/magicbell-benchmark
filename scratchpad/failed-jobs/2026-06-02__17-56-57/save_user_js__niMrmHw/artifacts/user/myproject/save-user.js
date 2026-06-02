const fs = require('fs/promises');
const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const email = process.env.MAGICBELL_EMAIL;
  const token = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !email || !token) {
    throw new Error('Missing required environment variables.');
  }

  const [local, domain] = email.split('@');
  if (!local || !domain) {
    throw new Error('MAGICBELL_EMAIL must be a valid email address.');
  }

  const plusEmail = `${local}+save-user-js-${runId}@${domain}`;

  const client = new Client({ token });

  const response = await client.users.saveUser({
    externalId: `user-${runId}`,
    email: plusEmail,
    firstName: 'Save',
    lastName: `User-${runId}`,
  });

  const userId = response?.data?.id;
  if (!userId) {
    throw new Error('MagicBell user ID not found in response.');
  }

  await fs.writeFile('/home/user/myproject/output.log', `User ID: ${userId}`);
  console.log(`User ID: ${userId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
