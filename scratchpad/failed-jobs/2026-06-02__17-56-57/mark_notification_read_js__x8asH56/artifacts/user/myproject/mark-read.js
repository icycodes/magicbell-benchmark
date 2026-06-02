import fs from 'node:fs/promises';
import jwt from 'jsonwebtoken';
import { Client as ProjectClient } from 'magicbell-js/project-client';
import { Client as UserClient } from 'magicbell-js/user-client';

const requiredEnv = [
  'ZEALT_RUN_ID',
  'MAGICBELL_EMAIL',
  'MAGICBELL_PROJECT_TOKEN',
  'MAGICBELL_API_KEY',
  'MAGICBELL_SECRET_KEY',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const runId = process.env.ZEALT_RUN_ID;
const baseEmail = process.env.MAGICBELL_EMAIL;
const [localPart, domain] = baseEmail.split('@');

if (!localPart || !domain) {
  throw new Error('MAGICBELL_EMAIL must be a valid email address');
}

const recipientEmail = `${localPart}+mark-read-js-${runId}@${domain}`;
const externalId = `user-mark-read-js-${runId}`;

const projectClient = new ProjectClient({
  token: process.env.MAGICBELL_PROJECT_TOKEN,
});

await projectClient.users.saveUser({
  externalId,
  email: recipientEmail,
  firstName: 'MarkRead',
  lastName: `JS-${runId}`,
});

const broadcastTitle = `Mark Read JS - ${runId}`;

await projectClient.broadcasts.createBroadcast({
  title: broadcastTitle,
  content: `Notification for mark-read JS run ${runId}.`,
  recipients: [{ externalId }],
});

const userToken = jwt.sign(
  {
    user_email: recipientEmail,
    user_external_id: externalId,
    api_key: process.env.MAGICBELL_API_KEY,
  },
  process.env.MAGICBELL_SECRET_KEY,
  {
    algorithm: 'HS256',
    expiresIn: '1y',
  },
);

const userClient = new UserClient({
  token: userToken,
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let notificationId = null;

for (let attempt = 1; attempt <= 10; attempt += 1) {
  const { data } = await userClient.notifications.listNotifications({
    limit: 50,
  });
  const notifications = data?.data ?? [];
  const match = notifications.find((notification) => notification.title === broadcastTitle);

  if (match) {
    notificationId = match.id;
    break;
  }

  await wait(2000 * attempt);
}

if (!notificationId) {
  throw new Error('Broadcast notification not found after polling.');
}

await userClient.notifications.markNotificationRead(notificationId);

await fs.writeFile(
  '/home/user/myproject/output.log',
  `Notification ID: ${notificationId}`,
  'utf8',
);

console.log(`Wrote notification ID to output.log: ${notificationId}`);
