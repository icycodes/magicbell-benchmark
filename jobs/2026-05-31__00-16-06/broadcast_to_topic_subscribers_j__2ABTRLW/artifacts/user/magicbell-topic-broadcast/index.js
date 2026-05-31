const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const API_BASE = 'https://api.magicbell.com/v2';
const OUTPUT_PATH = path.join(__dirname, 'output.log');

const {
  MAGICBELL_API_KEY: apiKey,
  MAGICBELL_SECRET_KEY: secretKey,
  MAGICBELL_PROJECT_TOKEN: projectToken,
  ZEALT_RUN_ID: runId,
} = process.env;

const requiredEnv = {
  MAGICBELL_API_KEY: apiKey,
  MAGICBELL_SECRET_KEY: secretKey,
  MAGICBELL_PROJECT_TOKEN: projectToken,
  ZEALT_RUN_ID: runId,
};

for (const [key, value] of Object.entries(requiredEnv)) {
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const userExternalId = `user-${runId}`;
const userEmail = `user+${runId}@gmail.com`;
const topicName = `announcements-${runId}`;
const broadcastTitle = `System Update - ${runId}`;

const writeLog = (lines) => {
  fs.writeFileSync(OUTPUT_PATH, `${lines.join('\n')}\n`, 'utf8');
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text;
  }

  if (!response.ok) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    throw new Error(`Request failed (${response.status}) ${response.statusText}: ${message}`);
  }

  return data;
};

const createUser = async () => {
  return requestJson(`${API_BASE}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MAGICBELL-API-KEY': apiKey,
      'X-MAGICBELL-API-SECRET': secretKey,
    },
    body: JSON.stringify({
      external_id: userExternalId,
      email: userEmail,
      first_name: 'Test',
      last_name: 'User',
    }),
  });
};

const generateUserJwt = () => {
  const payload = {
    user_email: userEmail,
    user_external_id: userExternalId,
    api_key: apiKey,
  };

  return jwt.sign(payload, secretKey, { algorithm: 'HS256' });
};

const subscribeToTopic = async (userJwt) => {
  return requestJson(`${API_BASE}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwt}`,
      'X-MAGICBELL-API-KEY': apiKey,
    },
    body: JSON.stringify({
      topic: topicName,
    }),
  });
};

const sendBroadcast = async () => {
  return requestJson(`${API_BASE}/broadcasts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${projectToken}`,
      'X-MAGICBELL-API-KEY': apiKey,
    },
    body: JSON.stringify({
      title: broadcastTitle,
      content: 'This is a broadcast to all subscribers.',
      topic: topicName,
      recipients: [{ topic: { subscribers: true } }],
    }),
  });
};

const fetchNotifications = async (userJwt) => {
  return requestJson(`${API_BASE}/notifications`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userJwt}`,
      'X-MAGICBELL-API-KEY': apiKey,
    },
  });
};

const main = async () => {
  try {
    await createUser();
    const userJwt = generateUserJwt();
    await subscribeToTopic(userJwt);
    const broadcastResponse = await sendBroadcast();

    const notificationsResponse = await fetchNotifications(userJwt);
    const notifications = notificationsResponse?.notifications || notificationsResponse || [];
    const matched = notifications.find((notification) => notification?.title === broadcastTitle);

    if (!matched) {
      throw new Error('Broadcast notification not found for user.');
    }

    const broadcastId =
      broadcastResponse?.broadcast?.id ||
      broadcastResponse?.broadcast_id ||
      broadcastResponse?.id ||
      'unknown';

    writeLog([
      `User Created: ${userEmail}`,
      `User JWT Generated: ${userJwt}`,
      `Subscribed to Topic: ${topicName}`,
      `Broadcast Sent ID: ${broadcastId}`,
      `Notification Received Title: ${matched.title}`,
    ]);

    console.log('Broadcast flow completed.');
  } catch (error) {
    console.error('Error running MagicBell broadcast flow:', error.message);
    process.exit(1);
  }
};

main();
