const fs = require('fs');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  // Read environment variables
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  // Construct the user email
  const userEmail = `${magicbellEmail}+${runId}@gmail.com`;

  // Generate a User JWT signed with HS256
  const token = jwt.sign(
    {
      user_email: userEmail,
      api_key: apiKey,
    },
    secretKey,
    {
      algorithm: 'HS256',
    }
  );

  // Initialize the MagicBell UserClient with the generated token
  const client = new Client({
    token: token,
  });

  // Fetch the user's channel delivery preferences
  const response = await client.channels.fetchUserPreferences();

  // Write the fetched preferences data to output.log
  fs.writeFileSync(
    '/home/user/magicbell-nodejs-fetch-preferences/output.log',
    JSON.stringify(response.data)
  );
}

main().catch((err) => {
  console.error('Error fetching preferences:', err);
  process.exit(1);
});