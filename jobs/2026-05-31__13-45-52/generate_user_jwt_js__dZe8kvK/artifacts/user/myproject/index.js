const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const runId = process.env.ZEALT_RUN_ID;

  if (!apiKey || !secretKey || !runId) {
    console.error('Missing required environment variables: MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, ZEALT_RUN_ID');
    process.exit(1);
  }

  // Generate User JWT
  const payload = {
    user_email: `user-${runId}@gmail.com`,
    user_external_id: `ext-${runId}`,
    api_key: apiKey,
  };

  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256', expiresIn: '1h' });

  // Save JWT to file
  fs.writeFileSync(path.join(__dirname, 'user_jwt.txt'), token, 'utf-8');

  // Build log lines
  const logLines = [];
  logLines.push(`User JWT: ${token}`);

  // Initialize MagicBell UserClient and fetch notifications
  try {
    const client = new Client({
      token: token,
    });

    await client.notifications.listNotifications({ limit: 5 });
    logLines.push('API Status: Success');
  } catch (error) {
    logLines.push(`API Status: Failed - ${error.message}`);
  }

  // Save log file
  fs.writeFileSync(path.join(__dirname, 'output.log'), logLines.join('\n'), 'utf-8');

  console.log(logLines.join('\n'));
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});