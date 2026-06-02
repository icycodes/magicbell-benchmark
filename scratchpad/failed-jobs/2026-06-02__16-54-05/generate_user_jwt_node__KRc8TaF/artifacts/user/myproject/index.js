const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

async function main() {
  const {
    MAGICBELL_EMAIL,
    MAGICBELL_PROJECT_TOKEN,
    MAGICBELL_API_KEY,
    MAGICBELL_SECRET_KEY,
    ZEALT_RUN_ID,
  } = process.env;

  if (!MAGICBELL_EMAIL || !MAGICBELL_PROJECT_TOKEN || !MAGICBELL_API_KEY || !MAGICBELL_SECRET_KEY || !ZEALT_RUN_ID) {
    console.error('Missing required environment variables:');
    console.error({
      MAGICBELL_EMAIL: !!MAGICBELL_EMAIL,
      MAGICBELL_PROJECT_TOKEN: !!MAGICBELL_PROJECT_TOKEN,
      MAGICBELL_API_KEY: !!MAGICBELL_API_KEY,
      MAGICBELL_SECRET_KEY: !!MAGICBELL_SECRET_KEY,
      ZEALT_RUN_ID: !!ZEALT_RUN_ID,
    });
    process.exit(1);
  }

  // Derive identifiers
  const emailParts = MAGICBELL_EMAIL.split('@');
  if (emailParts.length !== 2) {
    console.error('Invalid MAGICBELL_EMAIL format');
    process.exit(1);
  }
  const email = `${emailParts[0]}+jwt-node-${ZEALT_RUN_ID}@${emailParts[1]}`;
  const externalId = `user-jwt-node-${ZEALT_RUN_ID}`;

  console.log(`Derived email: ${email}`);
  console.log(`Derived external_id: ${externalId}`);

  // Upsert user
  console.log('Upserting user to MagicBell...');
  const userPayload = {
    email: email,
    external_id: externalId,
  };

  let response;
  let responseBody = '';

  // We will try PUT first, and then POST if PUT fails, or vice versa, to be extremely robust.
  try {
    console.log('Trying PUT to https://api.magicbell.com/v2/users...');
    response = await fetch('https://api.magicbell.com/v2/users', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${MAGICBELL_PROJECT_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(userPayload),
    });
    responseBody = await response.text();
    console.log(`PUT response status: ${response.status}`);
    console.log(`PUT response body: ${responseBody}`);
  } catch (err) {
    console.error('PUT request threw an error:', err);
  }

  if (!response || !response.ok) {
    console.log('PUT failed or was not successful. Trying POST to https://api.magicbell.com/v2/users...');
    try {
      response = await fetch('https://api.magicbell.com/v2/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MAGICBELL_PROJECT_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userPayload),
      });
      responseBody = await response.text();
      console.log(`POST response status: ${response.status}`);
      console.log(`POST response body: ${responseBody}`);
    } catch (err) {
      console.error('POST request threw an error:', err);
    }
  }

  if (!response || !response.ok) {
    console.log('Trying POST with nested user payload...');
    try {
      const nestedUserPayload = {
        user: {
          email: email,
          external_id: externalId,
        }
      };
      response = await fetch('https://api.magicbell.com/v2/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MAGICBELL_PROJECT_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(nestedUserPayload),
      });
      responseBody = await response.text();
      console.log(`Nested POST response status: ${response.status}`);
      console.log(`Nested POST response body: ${responseBody}`);
    } catch (err) {
      console.error('Nested POST request threw an error:', err);
    }
  }

  if (!response || !response.ok) {
    throw new Error(`Failed to upsert user after trying all methods. Last status: ${response ? response.status : 'N/A'}`);
  }

  // Mint JWT
  console.log('Minting User JWT...');
  const payload = {
    user_email: email,
    user_external_id: externalId,
    api_key: MAGICBELL_API_KEY,
  };

  const token = jwt.sign(payload, MAGICBELL_SECRET_KEY, {
    algorithm: 'HS256',
    expiresIn: '1y',
  });

  console.log(`Generated Token: ${token}`);

  // Write to log file
  const logFilePath = path.join(__dirname, 'output.log');
  fs.writeFileSync(logFilePath, `User JWT: ${token}\n`);
  console.log(`Wrote token to ${logFilePath}`);

  // Verify the JWT by calling MagicBell's user-authenticated REST API
  console.log('Verifying JWT against MagicBell REST API (GET /v2/notifications)...');
  const verifyResponse = await fetch('https://api.magicbell.com/v2/notifications', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  let verifyBody = '';
  try {
    verifyBody = await verifyResponse.text();
  } catch (err) {
    // ignore
  }

  console.log(`Verify response status: ${verifyResponse.status}`);
  console.log(`Verify response body: ${verifyBody}`);

  if (verifyResponse.status === 200) {
    console.log('Verification SUCCESSFUL! Token is valid and usable.');
  } else {
    throw new Error(`Verification FAILED: ${verifyResponse.status} - ${verifyBody}`);
  }
}

main().catch((err) => {
  console.error('Error occurred in main:', err);
  process.exit(1);
});
