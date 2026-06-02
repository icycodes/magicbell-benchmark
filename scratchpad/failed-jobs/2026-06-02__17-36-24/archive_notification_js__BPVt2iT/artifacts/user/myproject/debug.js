'use strict';

const { Client: ProjectClient } = require('magicbell-js/project-client');
const { Client: UserClient } = require('magicbell-js/user-client');
const jwt = require('jsonwebtoken');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  const externalId = `user-archive-js-${runId}`;
  const [local, domain] = magicbellEmail.split('@');
  const userEmail = `${local}+archive-js-${runId}@${domain}`;

  // Sign JWT
  const userJwt = jwt.sign(
    {
      user_email: userEmail,
      user_external_id: externalId,
      api_key: apiKey,
    },
    secretKey,
    { algorithm: 'HS256' }
  );

  const userClient = new UserClient({ token: userJwt });

  console.log('Listing notifications...');
  try {
    const listResponse = await userClient.notifications.listNotifications({ limit: 50 });
    console.log('Status:', listResponse.metadata.status);
    console.log('Data:', JSON.stringify(listResponse.data, null, 2));
  } catch (err) {
    console.error('Error listing notifications:', err.message);
    // Try to get raw response
    console.error('Full error:', JSON.stringify(err, null, 2));
  }

  // Also check project client - list users
  const projectClient = new ProjectClient({ token: projectToken });
  console.log('\nListing users...');
  try {
    const usersResponse = await projectClient.users.listUsers({ query: externalId });
    console.log('Users status:', usersResponse.metadata.status);
    console.log('Users data:', JSON.stringify(usersResponse.data, null, 2));
  } catch (err) {
    console.error('Error listing users:', err.message);
  }
}

main().catch(console.error);
