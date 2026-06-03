const { Client } = require('magicbell-js/project-client');
require('dotenv').config();

const runId = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

const email = magicbellEmail.includes('@')
  ? `${magicbellEmail.split('@')[0]}+${runId}@gmail.com`
  : `${magicbellEmail}+${runId}@gmail.com`;

const externalId = `user-${runId}`;

console.log('Email:', email);
console.log('External ID:', externalId);

const client = new Client({
  token: projectToken
});

async function main() {
  try {
    console.log('Upserting user...');
    const userRes = await client.users.saveUser({
      email: email,
      externalId: externalId
    });
    console.log('User upserted:', userRes.data);

    console.log('Creating broadcast...');
    const broadcastRes = await client.broadcasts.createBroadcast({
      title: `Welcome to MagicBell ${runId}`,
      recipients: [
        {
          email: email,
          externalId: externalId
        }
      ],
      content: `Welcome to MagicBell ${runId}`
    });
    console.log('Broadcast created:', broadcastRes.data);
  } catch (err) {
    console.error('Error:', err.message, err.response ? err.response.data : '');
  }
}

main();
