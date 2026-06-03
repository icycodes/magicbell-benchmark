const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');
const fs = require('fs');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmailEnv = process.env.MAGICBELL_EMAIL;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  if (!runId || !magicbellEmailEnv || !apiKey || !secretKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  // Ensure the email is formatted correctly if MAGICBELL_EMAIL contains @gmail.com
  const MAGICBELL_EMAIL = magicbellEmailEnv.replace('@gmail.com', '');
  const userEmail = `${MAGICBELL_EMAIL}+${runId}@gmail.com`;

  // Generate User JWT with api_key in payload for V2 API
  const token = jwt.sign(
    { user_email: userEmail, api_key: apiKey },
    secretKey,
    { algorithm: 'HS256' }
  );

  const client = new Client({ token });

  try {
    await client.channels.saveUserPreferences({
      categories: [
        {
          key: 'default',
          channels: [
            {
              name: 'email',
              enabled: false
            }
          ]
        }
      ]
    });
    
    fs.writeFileSync('/home/user/myproject/output.log', 'Preferences updated.\n');
    console.log('Preferences updated.');
  } catch (err) {
    console.error('Error updating preferences:', err);
    fs.writeFileSync('/home/user/myproject/output.log', `Error: ${err.message}\n`);
    process.exit(1);
  }
}

main();
