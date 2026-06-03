const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  try {
    const magicbellEmail = process.env.MAGICBELL_EMAIL;
    const runId = process.env.ZEALT_RUN_ID;
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;

    if (!magicbellEmail || !runId || !apiKey || !secretKey) {
      console.error('Error: Missing required environment variables (MAGICBELL_EMAIL, ZEALT_RUN_ID, MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY).');
      process.exit(1);
    }

    const localPart = magicbellEmail.includes('@') ? magicbellEmail.split('@')[0] : magicbellEmail;
    const email = `${localPart}+list-tokens-${runId}@gmail.com`;

    console.log(`Generating User JWT for email: ${email}`);

    const payload = {
      user_email: email,
      api_key: apiKey
    };

    const token = jwt.sign(payload, secretKey, {
      algorithm: 'HS256'
    });

    console.log('User JWT generated successfully.');

    console.log('Initializing MagicBell UserClient...');
    const client = new Client({ token });

    console.log('Fetching inbox tokens...');
    const response = await client.channels.listInboxTokens();

    const tokensArray = response.data && response.data.data ? response.data.data : [];
    console.log(`Successfully fetched ${tokensArray.length} inbox tokens.`);

    const outputPath = '/home/user/magicbell-nodejs-list-inbox-tokens/output.json';
    fs.writeFileSync(outputPath, JSON.stringify(tokensArray, null, 2), 'utf8');
    console.log(`Tokens written to ${outputPath}`);
  } catch (error) {
    console.error('An error occurred during execution:', error);
    process.exit(1);
  }
}

main();
