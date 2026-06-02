const fs = require('fs');
const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const emailEnv = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !emailEnv || !projectToken) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const client = new Client({ token: projectToken });

  const [local, domain] = emailEnv.split('@');
  const email = `${local}+save-user-js-${runId}@${domain}`;

  try {
    const response = await client.users.saveUser({
      externalId: `user-${runId}`,
      email: email,
      firstName: 'Save',
      lastName: `User-${runId}`
    });

    const userId = response.data.id;
    fs.writeFileSync('/home/user/myproject/output.log', `User ID: ${userId}\n`);
    console.log(`Successfully saved user. User ID: ${userId}`);
  } catch (error) {
    console.error('Error saving user:', error);
    process.exit(1);
  }
}

main();
