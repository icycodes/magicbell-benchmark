const { Client: ProjectClient } = require('magicbell-js/project-client');
const fs = require('fs');

async function main() {
  const email = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!email || !runId || !projectToken) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const recipientEmail = `${email}+${runId}@gmail.com`;

  const magicbell = new ProjectClient({
    token: projectToken,
  });

  try {
    const response = await magicbell.broadcasts.createBroadcast({
      title: `System update for run ${runId}`,
      content: `This is a broadcast for run ${runId}`,
      category: 'system-update',
      recipients: [{ email: recipientEmail }],
    });

    console.log('Broadcast created:', response.data);
    fs.writeFileSync('/home/user/project/output.log', `Broadcast ID: ${response.data.id}\n`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
