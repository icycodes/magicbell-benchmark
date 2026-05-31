const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const { Client: UserClient } = require('magicbell-js/user-client');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const apiKey = requireEnv('MAGICBELL_API_KEY');
  const secretKey = requireEnv('MAGICBELL_SECRET_KEY');
  const runId = requireEnv('ZEALT_RUN_ID');

  const payload = {
    user_email: `user-${runId}@gmail.com`,
    user_external_id: `ext-${runId}`,
    api_key: apiKey,
  };

  const token = jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });

  await fs.writeFile('/home/user/myproject/user_jwt.txt', `${token}\n`);

  const logLines = [`User JWT: ${token}`];

  try {
    const client = new UserClient({
      apiKey,
      token,
    });

    await client.notifications.listNotifications({ limit: 5 });
    logLines.push('API Status: Success');
  } catch (error) {
    logLines.push('API Status: Failed');
    logLines.push(`Error: ${error.message}`);
  }

  await fs.writeFile('/home/user/myproject/output.log', `${logLines.join('\n')}\n`);
}

main().catch(async (error) => {
  const message = `Error: ${error.message}`;
  await fs.writeFile('/home/user/myproject/output.log', `${message}\n`);
  console.error(message);
  process.exitCode = 1;
});
