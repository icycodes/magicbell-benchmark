'use strict';

const fs = require('fs');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  if (!runId || !magicbellEmail || !apiKey || !secretKey) {
    throw new Error('Missing required environment variables: ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY');
  }

  const userEmail = `${magicbellEmail.split('@')[0]}+${runId}@gmail.com`;

  // Generate a User JWT signed with HS256
  // MagicBell requires user_email and api_key in the payload
  const token = jwt.sign(
    {
      user_email: userEmail,
      api_key: apiKey,
    },
    secretKey,
    { algorithm: 'HS256' }
  );

  // Initialize the UserClient with the JWT token
  const client = new Client({ token });

  // Save user preferences: disable the email channel for the default category
  await client.channels.saveUserPreferences({
    categories: [
      {
        key: 'default',
        channels: [
          {
            name: 'email',
            enabled: false,
          },
        ],
      },
    ],
  });

  // Write success message to log file
  fs.writeFileSync('/home/user/myproject/output.log', 'Preferences updated.\n');
  console.log('Preferences updated.');
}

main().catch((err) => {
  console.error('Error updating preferences:', err);
  process.exit(1);
});
