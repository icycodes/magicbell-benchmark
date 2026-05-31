const fs = require('fs');
const { Client } = require('magicbell-js/project-client');

async function main() {
  try {
    const runId = process.env.ZEALT_RUN_ID;
    const gmailUser = process.env.GMAIL_USER_NAME;
    const token = process.env.MAGICBELL_PROJECT_TOKEN;

    if (!runId || !gmailUser || !token) {
      throw new Error('Missing required environment variables');
    }

    const client = new Client({ token });

    // Create/upsert user
    const externalId = `user_${runId}`;
    const email = `${gmailUser}+${runId}@gmail.com`;
    
    console.log(`Creating user with externalId: ${externalId}, email: ${email}`);
    const userRes = await client.users.saveUser({
      externalId,
      email,
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('User created:', userRes.data);

    // Send broadcast
    console.log('Sending broadcast...');
    const broadcastRes = await client.broadcasts.createBroadcast({
      title: `Welcome to MagicBell ${runId}!`,
      content: `This is a test notification for run ${runId}.`,
      recipients: [{ externalId }]
    });

    console.log('Broadcast created:', broadcastRes.data);
    const broadcastId = broadcastRes.data.id;

    fs.writeFileSync('/home/user/myproject/output.log', `Broadcast ID: ${broadcastId}\n`);
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();