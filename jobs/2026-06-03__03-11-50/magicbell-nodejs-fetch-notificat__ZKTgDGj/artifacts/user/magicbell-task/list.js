const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  
  const emailPrefix = magicbellEmail.split('@')[0];
  const userEmail = `${emailPrefix}+user_${runId}@gmail.com`;

  const payload = {
    external_id: `user_${runId}`,
    user_email: userEmail,
    api_key: apiKey
  };

  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
  const client = new Client({ token });

  try {
    const response = await client.notifications.listNotifications();
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

main();