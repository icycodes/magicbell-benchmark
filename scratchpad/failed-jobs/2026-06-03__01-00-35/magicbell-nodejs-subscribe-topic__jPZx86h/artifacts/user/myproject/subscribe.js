const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

async function run() {
  const runId = process.env.ZEALT_RUN_ID;
  const baseEmail = process.env.MAGICBELL_EMAIL;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const apiSecret = process.env.MAGICBELL_SECRET_KEY;

  if (!runId || !baseEmail || !apiKey || !apiSecret) {
    console.error('Error: Missing required environment variables.');
    process.exit(1);
  }

  // 1. Construct user email and external ID
  const [local, domain] = baseEmail.split('@');
  const userEmail = `${local}+topic-sub-${runId}@${domain}`;
  const externalId = `user-topic-sub-${runId}`;
  const topicName = `updates-${runId}`;

  console.log(`Run ID: ${runId}`);
  console.log(`User Email: ${userEmail}`);
  console.log(`External ID: ${externalId}`);
  console.log(`Topic Name: ${topicName}`);

  // 2. Generate User JWT using jsonwebtoken package
  const userJwtPayload = {
    user_email: userEmail,
    user_external_id: externalId,
    api_key: apiKey
  };

  const userJwt = jwt.sign(userJwtPayload, apiSecret, {
    algorithm: 'HS256',
    expiresIn: '1y'
  });

  console.log(`Generated User JWT: ${userJwt}`);

  // 3. Ensure the user is saved/created in MagicBell
  console.log('Creating/saving user...');
  const userResponse = await fetch('https://api.magicbell.com/users', {
    method: 'POST',
    headers: {
      'X-MAGICBELL-API-KEY': apiKey,
      'X-MAGICBELL-API-SECRET': apiSecret,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      user: {
        external_id: externalId,
        email: userEmail
      }
    })
  });

  if (!userResponse.ok) {
    const errorText = await userResponse.text();
    throw new Error(`Failed to save/create user: Status ${userResponse.status}. Response: ${errorText}`);
  }

  const userData = await userResponse.json();
  console.log('User saved/created successfully:', JSON.stringify(userData));

  // 4. Subscribe the user to the topic using POST /subscriptions
  console.log('Subscribing user to topic...');
  const subscriptionResponse = await fetch('https://api.magicbell.com/subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-MAGICBELL-API-KEY': apiKey,
      'X-MAGICBELL-API-SECRET': apiSecret,
      'X-MAGICBELL-USER-EXTERNAL-ID': externalId
    },
    body: JSON.stringify({
      subscription: {
        topic: topicName,
        categories: [
          {
            slug: '*'
          }
        ]
      }
    })
  });

  if (!subscriptionResponse.ok) {
    const errorText = await subscriptionResponse.text();
    throw new Error(`Failed to subscribe user to topic: Status ${subscriptionResponse.status}. Response: ${errorText}`);
  }

  const subscriptionData = await subscriptionResponse.json();
  console.log('Subscription response:', JSON.stringify(subscriptionData));

  // 5. Write success output to log file
  const logFilePath = '/home/user/myproject/output.log';
  const logContent = [
    `Timestamp: ${new Date().toISOString()}`,
    `Run ID: ${runId}`,
    `User Email: ${userEmail}`,
    `User External ID: ${externalId}`,
    `Topic Name: ${topicName}`,
    `User JWT: ${userJwt}`,
    `User Creation Response: ${JSON.stringify(userData)}`,
    `Subscription Response: ${JSON.stringify(subscriptionData)}`,
    `Subscription successful`
  ].join('\n') + '\n';

  fs.writeFileSync(logFilePath, logContent, 'utf8');
  console.log(`Success log written to ${logFilePath}`);
}

run().catch((error) => {
  console.error('Execution failed:', error);
  process.exit(1);
});
