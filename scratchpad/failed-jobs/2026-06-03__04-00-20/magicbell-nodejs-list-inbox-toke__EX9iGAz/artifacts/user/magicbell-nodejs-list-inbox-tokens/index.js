const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const email = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;

  // Format the user email: take the local part and append +list-tokens-{run-id}
  const localPart = email.split('@')[0];
  const userEmail = `${localPart}+list-tokens-${runId}@gmail.com`;

  console.log('User email:', userEmail);

  // Generate User JWT with user_email and api_key, signed with HS256
  const token = jwt.sign(
    {
      user_email: userEmail,
      api_key: apiKey,
    },
    secretKey,
    { algorithm: 'HS256' }
  );

  // Initialize UserClient with the generated token
  const client = new Client({ token });

  // Fetch inbox tokens
  const response = await client.channels.listInboxTokens();

  // Extract the data array from the response
  const tokens = response.data?.data || [];

  console.log('Fetched tokens:', JSON.stringify(tokens, null, 2));

  // Write the tokens array to output.json
  const outputPath = path.join(__dirname, 'output.json');
  fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));
  console.log('Output written to', outputPath);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});