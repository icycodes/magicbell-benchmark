'use strict';

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// ---------------------------------------------------------------------------
// 1. Read required environment variables
// ---------------------------------------------------------------------------
const {
  MAGICBELL_EMAIL,
  MAGICBELL_PROJECT_TOKEN, // kept for reference / future v2 usage
  MAGICBELL_API_KEY,
  MAGICBELL_SECRET_KEY,
  ZEALT_RUN_ID,
} = process.env;

const REQUIRED_VARS = [
  'MAGICBELL_EMAIL',
  'MAGICBELL_PROJECT_TOKEN',
  'MAGICBELL_API_KEY',
  'MAGICBELL_SECRET_KEY',
  'ZEALT_RUN_ID',
];

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    console.error(`ERROR: Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 2. Derive per-run identifiers
// ---------------------------------------------------------------------------
const [localPart, domain] = MAGICBELL_EMAIL.split('@');
const userEmail = `${localPart}+jwt-node-${ZEALT_RUN_ID}@${domain}`;
const userExternalId = `user-jwt-node-${ZEALT_RUN_ID}`;

console.log(`Run ID        : ${ZEALT_RUN_ID}`);
console.log(`User email    : ${userEmail}`);
console.log(`External ID   : ${userExternalId}`);

// ---------------------------------------------------------------------------
// 3. Upsert the MagicBell user (POST /users – v1 admin API)
//    Uses X-MAGICBELL-API-KEY + X-MAGICBELL-API-SECRET (project credentials).
//    The v1 endpoint is the standard upsert path; v2 /users only accepts GET.
// ---------------------------------------------------------------------------
async function upsertUser() {
  const url = 'https://api.magicbell.com/users';

  const body = JSON.stringify({
    user: {
      external_id: userExternalId,
      email: userEmail,
    },
  });

  console.log(`\nUpserting user at ${url} …`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MAGICBELL-API-KEY': MAGICBELL_API_KEY,
      'X-MAGICBELL-API-SECRET': MAGICBELL_SECRET_KEY,
    },
    body,
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `MagicBell upsert failed – HTTP ${response.status}: ${responseText}`
    );
  }

  console.log(`Upsert response (${response.status}): ${responseText}`);
  return JSON.parse(responseText);
}

// ---------------------------------------------------------------------------
// 4. Mint the User JWT (HS256, signed with the project secret key)
// ---------------------------------------------------------------------------
function mintJwt() {
  const payload = {
    user_email: userEmail,
    user_external_id: userExternalId,
    api_key: MAGICBELL_API_KEY,
  };

  const token = jwt.sign(payload, MAGICBELL_SECRET_KEY, {
    algorithm: 'HS256',
    expiresIn: '1y',
  });

  console.log('\nJWT minted successfully.');
  return token;
}

// ---------------------------------------------------------------------------
// 5. Write the token to output.log
// ---------------------------------------------------------------------------
function writeLog(token) {
  const logPath = path.join(__dirname, 'output.log');
  const line = `User JWT: ${token}\n`;
  fs.writeFileSync(logPath, line, 'utf8');
  console.log(`Token written to ${logPath}`);
}

// ---------------------------------------------------------------------------
// 6. Main
// ---------------------------------------------------------------------------
(async () => {
  try {
    await upsertUser();
    const token = mintJwt();
    writeLog(token);
    console.log('\nDone.');
  } catch (err) {
    console.error('\nFATAL:', err.message);
    process.exit(1);
  }
})();
