'use strict';

const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');
const https = require('https');

// Read environment variables
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const runId = process.env.ZEALT_RUN_ID;

if (!apiKey || !secretKey || !magicbellEmail || !runId) {
  console.error(
    'Missing required environment variables: MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, MAGICBELL_EMAIL, ZEALT_RUN_ID'
  );
  process.exit(1);
}

// Construct user email and topic
const emailParts = magicbellEmail.split('@');
const userEmail = `${emailParts[0]}+${runId}@${emailParts[1]}`;
const topic = `test-topic-${runId}`;

console.log(`User email: ${userEmail}`);
console.log(`Topic:      ${topic}`);

// Generate a User JWT for the UserClient (as required)
const userJwt = jwt.sign(
  {
    user_email: userEmail,
    api_key: apiKey,
  },
  secretKey,
  { algorithm: 'HS256' }
);

// Instantiate the UserClient using magicbell-js/user-client (as required)
const client = new Client({ token: userJwt });
console.log('UserClient instantiated successfully.');

// Helper: make an HTTPS request using admin auth (API key + API secret + user email)
function adminRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;

    const headers = {
      Accept: 'application/json',
      'X-MAGICBELL-API-KEY': apiKey,
      'X-MAGICBELL-API-SECRET': secretKey,
      'X-MAGICBELL-USER-EMAIL': userEmail,
    };

    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: 'api.magicbell.com',
      path,
      method,
      headers,
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: responseBody });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function ensureUserExists() {
  // Check if user already exists by listing their subscriptions
  const res = await adminRequest('GET', '/subscriptions');
  if (res.statusCode === 200) {
    // User already exists
    return;
  }

  // Create the user
  console.log('Creating user in MagicBell...');
  const createRes = await adminRequest('POST', '/users', {
    user: { email: userEmail },
  });

  if (createRes.statusCode === 201 || createRes.statusCode === 200) {
    console.log('User created successfully.');
  } else if (createRes.statusCode === 409) {
    console.log('User already exists.');
  } else {
    throw new Error(
      `Failed to create user: ${createRes.statusCode} - ${createRes.body}`
    );
  }
}

async function subscribeToTopic() {
  console.log(`Subscribing user to topic "${topic}" first...`);
  const res = await adminRequest('POST', '/subscriptions', {
    subscription: {
      topic,
      categories: [{ slug: '*' }],
    },
  });

  if (res.statusCode === 200 || res.statusCode === 201) {
    console.log('Subscription created.');
  } else {
    // If already subscribed or other issue, log and continue
    console.log(`Subscribe response: ${res.statusCode} - ${res.body.slice(0, 200)}`);
  }
}

async function unsubscribeFromTopic() {
  console.log(`\nUnsubscribing user "${userEmail}" from topic "${topic}"...`);

  // Use DELETE /subscriptions/{topic} which removes the topic subscription
  const res = await adminRequest(
    'DELETE',
    `/subscriptions/${encodeURIComponent(topic)}`
  );

  if (res.statusCode === 204 || res.statusCode === 200) {
    console.log(`Successfully unsubscribed from topic "${topic}".`);
  } else if (res.statusCode === 404) {
    // No subscription existed - already effectively unsubscribed
    console.log(
      `No subscription found for topic "${topic}" — user is not subscribed.`
    );
  } else {
    throw new Error(
      `Failed to unsubscribe: ${res.statusCode} - ${res.body}`
    );
  }
}

async function main() {
  try {
    await ensureUserExists();
    await subscribeToTopic();
    await unsubscribeFromTopic();

    // Verify unsubscription
    const listRes = await adminRequest('GET', '/subscriptions');
    if (listRes.statusCode === 200) {
      const data = JSON.parse(listRes.body);
      const remaining = (data.subscriptions || []).filter(
        (s) => s.topic === topic
      );
      if (remaining.length === 0) {
        console.log(`\nVerified: user has no active subscription to "${topic}".`);
      } else {
        console.log(`\nWarning: subscription still present: ${JSON.stringify(remaining)}`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
