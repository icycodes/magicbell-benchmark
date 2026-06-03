'use strict';

const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  // Read environment variables
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const emailBase = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;

  if (!apiKey || !secretKey || !emailBase || !runId) {
    throw new Error(
      'Missing required environment variables: MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, MAGICBELL_EMAIL, ZEALT_RUN_ID'
    );
  }

  // Construct the user email in plus format.
  // MAGICBELL_EMAIL may be a full address like "user@gmail.com"; extract the
  // local part so the result is "user+<runId>@gmail.com".
  const atIndex = emailBase.indexOf('@');
  const localPart = atIndex !== -1 ? emailBase.slice(0, atIndex) : emailBase;
  const domain = atIndex !== -1 ? emailBase.slice(atIndex) : '@gmail.com';
  const userEmail = `${localPart}+${runId}${domain}`;
  console.log(`Target user email: ${userEmail}`);

  // Generate a User JWT signed with HS256
  const token = jwt.sign(
    { user_email: userEmail, api_key: apiKey },
    secretKey,
    { algorithm: 'HS256' }
  );

  // Initialize the MagicBell UserClient
  const client = new Client({ token });

  // POST /notifications/seen using fetch directly (no SDK method available for this endpoint).
  // The seen endpoint lives on the v1 base URL (no /v2 prefix).
  const baseUrl = 'https://api.magicbell.com';
  const response = await fetch(`${baseUrl}/notifications/seen`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to mark all notifications as seen. Status: ${response.status} – ${body}`);
  }

  console.log('Success: All notifications have been marked as seen.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
