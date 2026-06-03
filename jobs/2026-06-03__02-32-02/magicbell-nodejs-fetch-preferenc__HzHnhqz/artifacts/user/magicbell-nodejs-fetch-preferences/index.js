const fs = require('fs');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  const userEmail = `${magicbellEmail}+${runId}@gmail.com`;

  const token = jwt.sign(
    { user_email: userEmail, api_key: apiKey },
    secretKey,
    { algorithm: 'HS256' }
  );

  const client = new Client({ token });

  const response = await client.channels.fetchUserPreferences();

  fs.writeFileSync('output.log', JSON.stringify(response.data));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
