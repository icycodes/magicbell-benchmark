const { Client } = require('magicbell-js/user-client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const runId = process.env.ZEALT_RUN_ID;
    const emailBase = process.env.MAGICBELL_EMAIL;
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;

    if (!runId || !emailBase || !apiKey || !secretKey) {
      console.error('Missing required environment variables');
      process.exit(1);
    }

    const email = `${emailBase}+${runId}@gmail.com`;

    const token = jwt.sign({ user_email: email, api_key: apiKey }, secretKey, { algorithm: 'HS256' });

    const client = new Client({ token: token });

    const response = await client.channels.fetchUserPreferences();
    
    // The instructions say: "Write the resulting data object to output.log using fs.writeFileSync."
    fs.writeFileSync(path.join(__dirname, 'output.log'), JSON.stringify(response.data, null, 2));
    console.log('Successfully fetched and wrote user preferences to output.log');
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    process.exit(1);
  }
}

main();
