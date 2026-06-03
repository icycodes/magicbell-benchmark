const fs = require('fs');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  try {
    const runId = process.env.ZEALT_RUN_ID || 'local';
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;
    
    let baseEmail = process.env.MAGICBELL_EMAIL || '';
    if (baseEmail.includes('@')) {
      baseEmail = baseEmail.split('@')[0];
    }
    const userEmail = `${baseEmail}+list-tokens-${runId}@gmail.com`;

    const payload = {
      user_email: userEmail,
      api_key: apiKey
    };

    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

    const client = new Client({ token });

    const response = await client.channels.listInboxTokens();
    const dataArray = response.data?.data || [];

    fs.writeFileSync('/home/user/magicbell-nodejs-list-inbox-tokens/output.json', JSON.stringify(dataArray, null, 2));
    console.log('Successfully wrote inbox tokens to output.json');
  } catch (error) {
    console.error('Error fetching inbox tokens:', error);
    process.exit(1);
  }
}

main();
