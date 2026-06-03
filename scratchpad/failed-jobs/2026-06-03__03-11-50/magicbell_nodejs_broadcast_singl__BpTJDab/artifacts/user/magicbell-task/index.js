const fs = require('fs');
const { Client: ProjectClient } = require('magicbell-js/project-client');

async function run() {
  const email = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!email || !runId || !projectToken) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const recipientEmail = `${email}+${runId}@gmail.com`;
  const title = `Test Broadcast ${runId}`;
  
  const client = new ProjectClient({ token: projectToken });

  try {
    const response = await client.broadcasts.createBroadcast({
      title: title,
      content: 'This is a test broadcast.',
      recipients: [{ email: recipientEmail }]
    });

    console.log(response);

    const broadcast = response.data || response.broadcast || response;
    fs.writeFileSync('/home/user/magicbell-task/output.log', `Broadcast ID: ${broadcast.id}\n`);
    console.log(`Broadcast created with ID: ${broadcast.id}`);
  } catch (error) {
    console.error('Error creating broadcast:', error);
    process.exit(1);
  }
}

run();
