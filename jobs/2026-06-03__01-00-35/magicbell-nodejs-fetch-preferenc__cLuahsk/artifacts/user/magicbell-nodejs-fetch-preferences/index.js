const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  try {
    // 1. Read environment variables
    const runId = process.env.ZEALT_RUN_ID;
    const magicbellEmail = process.env.MAGICBELL_EMAIL;
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;

    if (!runId || !magicbellEmail || !apiKey || !secretKey) {
      throw new Error('Missing required environment variables: ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY');
    }

    // 2. Construct the user's email
    const localPart = magicbellEmail.includes('@') ? magicbellEmail.split('@')[0] : magicbellEmail;
    const email = `${localPart}+${runId}@gmail.com`;
    console.log(`Constructed user email: ${email}`);

    // 3. Generate User JWT
    const payload = {
      user_email: email,
      api_key: apiKey
    };

    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
    console.log('Successfully generated User JWT.');

    // 4. Initialize MagicBell UserClient
    const client = new Client({
      token: token
    });

    // 5. Fetch user preferences
    console.log('Fetching user preferences...');
    const response = await client.channels.fetchUserPreferences();

    if (!response || !response.data) {
      throw new Error('Failed to fetch preferences: Empty response or data');
    }

    const preferencesData = response.data;
    console.log('Successfully fetched preferences:', JSON.stringify(preferencesData, null, 2));

    // 6. Write preferences to output.log
    const logFilePath = path.join(__dirname, 'output.log');
    fs.writeFileSync(logFilePath, JSON.stringify(preferencesData, null, 2), 'utf8');
    console.log(`Successfully wrote preferences to ${logFilePath}`);

  } catch (error) {
    console.error('Error executing script:', error);
    process.exit(1);
  }
}

main();
