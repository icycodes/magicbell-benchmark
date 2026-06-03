const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');
const fs = require('fs');
const path = require('path');

async function main() {
  // 1. Read environment variables
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  if (!runId || !magicbellEmail || !apiKey || !secretKey) {
    throw new Error('Missing required environment variables');
  }

  // 2. Construct user email (extract local part if MAGICBELL_EMAIL contains @)
  const localPart = magicbellEmail.includes('@') ? magicbellEmail.split('@')[0] : magicbellEmail;
  const userEmail = `${localPart}+${runId}@gmail.com`;

  // 3. Generate a User JWT signed with HS256
  const token = jwt.sign(
    { user_email: userEmail, api_key: apiKey },
    secretKey,
    { algorithm: 'HS256' }
  );

  // 4. Initialize the Client
  const client = new Client({ token });

  // 5. Save preferences: disable email channel for default category
  await client.channels.saveUserPreferences({
    categories: [
      {
        key: 'default',
        channels: [
          {
            name: 'email',
            enabled: false,
          },
        ],
      },
    ],
  });

  // 6. Write success message to log file
  const logPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(logPath, 'Preferences updated.\n');

  console.log('Preferences updated.');
}

main().catch((err) => {
  console.error('Error updating preferences:', err);
  process.exit(1);
});