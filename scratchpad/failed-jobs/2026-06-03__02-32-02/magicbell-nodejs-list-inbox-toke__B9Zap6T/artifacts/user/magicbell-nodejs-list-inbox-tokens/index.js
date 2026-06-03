const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;

  if (!apiKey || !secretKey || !magicbellEmail || !runId) {
    throw new Error('Missing required environment variables: MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, MAGICBELL_EMAIL, ZEALT_RUN_ID');
  }

  // Build user email
  const emailParts = magicbellEmail.split('@');
  const userEmail = `${emailParts[0]}+list-tokens-${runId}@${emailParts[1]}`;
  console.log(`Using user email: ${userEmail}`);

  // Generate User JWT
  const payload = {
    user_email: userEmail,
    api_key: apiKey,
  };

  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
  console.log('Generated User JWT successfully');

  // Initialize UserClient with the JWT token
  const client = new Client({ token });

  // Fetch inbox tokens
  console.log('Fetching inbox tokens...');
  const response = await client.channels.listInboxTokens();
  console.log('Response received');

  // Extract data array
  const tokensData = response.data;
  const tokensArray = (tokensData && tokensData.data) ? tokensData.data : (Array.isArray(tokensData) ? tokensData : []);

  console.log(`Found ${tokensArray.length} inbox token(s)`);

  // Write to output.json
  const outputPath = path.join(__dirname, 'output.json');
  fs.writeFileSync(outputPath, JSON.stringify(tokensArray, null, 2));
  console.log(`Output written to ${outputPath}`);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
