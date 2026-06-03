const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const runId = process.env.ZEALT_RUN_ID;
    const magicbellEmail = process.env.MAGICBELL_EMAIL;
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;

    if (!runId || !magicbellEmail || !apiKey || !secretKey) {
      throw new Error('Missing required environment variables: ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_API_KEY, or MAGICBELL_SECRET_KEY');
    }

    // Extract prefix if MAGICBELL_EMAIL contains @
    const emailPrefix = magicbellEmail.includes('@') ? magicbellEmail.split('@')[0] : magicbellEmail;
    const email = `${emailPrefix}+${runId}@gmail.com`;
    console.log(`Target User Email: ${email}`);

    // Generate User JWT
    const payload = {
      user_email: email,
      api_key: apiKey,
    };

    const token = jwt.sign(payload, secretKey, {
      algorithm: 'HS256',
    });

    console.log('User JWT generated successfully.');

    // Initialize UserClient
    const client = new Client({
      token: token,
    });

    // Save preferences to disable email channel for default category
    const body = {
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
    };

    console.log('Sending preferences update request...');
    await client.channels.saveUserPreferences(body);

    console.log('Preferences updated successfully.');

    // Write success message to log file
    const logFilePath = '/home/user/myproject/output.log';
    fs.writeFileSync(logFilePath, 'Preferences updated.\n');
    console.log(`Success logged to ${logFilePath}`);
  } catch (error) {
    console.error('Error updating preferences:', error);
    process.exit(1);
  }
}

main();
