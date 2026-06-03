'use strict';

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// --- Environment variables ---
const runId = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

if (!runId || !magicbellEmail || !apiKey || !secretKey) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

// --- Derive user fields ---
const [localPart, domain] = magicbellEmail.split('@');
const userEmail = `${localPart}+topic-sub-${runId}@${domain}`;
const externalId = `user-topic-sub-${runId}`;
const topicName = `updates-${runId}`;

const LOG_FILE = '/home/user/myproject/output.log';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

/**
 * Generate a User JWT for the MagicBell v2 API.
 * Payload: { user_external_id, api_key } signed with HS256 using the secret key.
 */
function generateUserJwt() {
  return jwt.sign(
    { user_external_id: externalId, api_key: apiKey },
    secretKey,
    { algorithm: 'HS256', expiresIn: '1h' }
  );
}

/**
 * Compute HMAC-SHA256 of the external ID using the secret key (base64 encoded).
 * Required by the MagicBell v1 REST API for user-scoped operations.
 */
function computeUserHmac() {
  return crypto.createHmac('sha256', secretKey).update(externalId).digest('base64');
}

// --- Simple HTTPS request helper ---
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Clear / create log file
  fs.writeFileSync(LOG_FILE, '');

  log(`Run ID      : ${runId}`);
  log(`External ID : ${externalId}`);
  log(`User email  : ${userEmail}`);
  log(`Topic       : ${topicName}`);

  // 1. Upsert the user via the v1 REST API (admin operation using API key + secret)
  log('Step 1: Upserting user via MagicBell v1 REST API...');
  const userBody = JSON.stringify({
    user: { external_id: externalId, email: userEmail },
  });
  const userResp = await httpsRequest(
    {
      hostname: 'api.magicbell.com',
      path: '/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(userBody),
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-API-SECRET': secretKey,
      },
    },
    userBody
  );
  log(`User upsert response status : ${userResp.statusCode}`);
  log(`User upsert response body   : ${userResp.body}`);

  if (userResp.statusCode < 200 || userResp.statusCode >= 300) {
    log(`ERROR: User upsert failed with status ${userResp.statusCode}`);
    process.exit(1);
  }

  // 2. Generate User JWT (for documentation) and compute HMAC for subscription
  log('Step 2: Generating User JWT and HMAC...');
  const userToken = generateUserJwt(); // eslint-disable-line no-unused-vars
  const userHmac = computeUserHmac();
  log('User JWT and HMAC generated.');

  // 3. Subscribe the user to the topic via the v1 REST API
  //    POST /subscriptions  with X-MAGICBELL-USER-HMAC (base64) + X-MAGICBELL-USER-EXTERNAL-ID
  log(`Step 3: Subscribing user "${externalId}" to topic "${topicName}"...`);
  const subBody = JSON.stringify({
    subscription: {
      topic: topicName,
      categories: [{ slug: '*' }],
    },
  });

  const subResp = await httpsRequest(
    {
      hostname: 'api.magicbell.com',
      path: '/subscriptions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(subBody),
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-USER-EXTERNAL-ID': externalId,
        'X-MAGICBELL-USER-HMAC': userHmac,
      },
    },
    subBody
  );

  log(`Subscription response status: ${subResp.statusCode}`);
  log(`Subscription response body  : ${subResp.body}`);

  if (subResp.statusCode >= 200 && subResp.statusCode < 300) {
    log('Subscription successful');
  } else {
    log(`ERROR: Subscription failed with status ${subResp.statusCode}`);
    process.exit(1);
  }
}

main().catch((err) => {
  const msg = `FATAL ERROR: ${err.message || err}`;
  console.error(msg);
  fs.appendFileSync(LOG_FILE, msg + '\n');
  process.exit(1);
});
