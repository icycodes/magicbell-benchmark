const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  if (!runId || !magicbellEmail || !projectToken || !apiKey || !secretKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  // Derive the email
  const parts = magicbellEmail.split('@');
  if (parts.length !== 2) {
    console.error('Invalid MAGICBELL_EMAIL format');
    process.exit(1);
  }
  const local = parts[0];
  const domain = parts[1];
  const userEmail = `${local}+save-user-cli-${runId}@${domain}`;
  const externalId = `user-${runId}`;

  console.log(`Derived User Email: ${userEmail}`);
  console.log(`Derived External ID: ${externalId}`);

  // Step 1: Login
  console.log('Logging in to MagicBell CLI...');
  const loginCmd = `magicbell login --manual --email "${magicbellEmail}" --jwt "${projectToken}" --api-key "${apiKey}" --secret-key "${secretKey}"`;
  execSync(loginCmd, { stdio: 'inherit' });

  // Step 2: Save User
  const userData = {
    external_id: externalId,
    email: userEmail,
    first_name: 'Harbor',
    last_name: 'Tester'
  };

  const dataStr = JSON.stringify(userData);
  console.log(`Saving user with data: ${dataStr}`);
  const saveCmd = `magicbell user save --data '${dataStr}'`;
  const output = execSync(saveCmd, { encoding: 'utf8' });

  console.log('CLI Save Output:\n', output);

  // Step 3: Parse output to find user ID
  const lines = output.split('\n');
  let userId = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.id && !parsed.level) {
        userId = parsed.id;
        break;
      }
    } catch (e) {
      // ignore parsing errors
    }
  }

  if (!userId) {
    console.error('Could not extract User ID from MagicBell CLI output');
    process.exit(1);
  }

  console.log(`Successfully extracted User ID: ${userId}`);

  // Step 4: Write to log file
  const logDir = '/home/user/magicbell-task';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logPath = path.join(logDir, 'output.log');
  fs.writeFileSync(logPath, `User ID: ${userId}\n`, 'utf8');
  console.log(`Logged to ${logPath}`);
}

run();
