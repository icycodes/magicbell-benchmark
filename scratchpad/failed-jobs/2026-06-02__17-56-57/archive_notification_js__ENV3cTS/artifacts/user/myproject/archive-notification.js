const fs = require('fs');
const jwt = require('jsonwebtoken');
const { Client: ProjectClient } = require('magicbell-js/project-client');
const { Client: UserClient } = require('magicbell-js/user-client');

const REQUIRED_ENV_VARS = [
  'MAGICBELL_PROJECT_TOKEN',
  'MAGICBELL_API_KEY',
  'MAGICBELL_SECRET_KEY',
  'MAGICBELL_EMAIL',
  'ZEALT_RUN_ID',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getEnvVar = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const deriveEmail = (baseEmail, runId) => {
  const atIndex = baseEmail.indexOf('@');
  if (atIndex === -1) {
    throw new Error('MAGICBELL_EMAIL must contain a domain part.');
  }
  const local = baseEmail.slice(0, atIndex);
  const domain = baseEmail.slice(atIndex + 1);
  return `${local}+archive-js-${runId}@${domain}`;
};

const pollForNotification = async (userClient, title, attempts = 20, delayMs = 2000) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await userClient.notifications.listNotifications({ limit: 50 });
    const notifications = response.data?.data ?? [];
    const match = notifications.find((notification) => notification.title === title);
    if (match) {
      return match;
    }

    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  throw new Error(`Timed out waiting for notification with title: ${title}`);
};

const main = async () => {
  REQUIRED_ENV_VARS.forEach(getEnvVar);

  const runId = getEnvVar('ZEALT_RUN_ID');
  const projectToken = getEnvVar('MAGICBELL_PROJECT_TOKEN');
  const apiKey = getEnvVar('MAGICBELL_API_KEY');
  const secretKey = getEnvVar('MAGICBELL_SECRET_KEY');
  const baseEmail = getEnvVar('MAGICBELL_EMAIL');

  const externalId = `user-archive-js-${runId}`;
  const userEmail = deriveEmail(baseEmail, runId);
  const broadcastTitle = `Archive JS - ${runId}`;

  const projectClient = new ProjectClient({ token: projectToken });

  await projectClient.users.saveUser({
    externalId,
    email: userEmail,
  });

  await projectClient.broadcasts.createBroadcast({
    title: broadcastTitle,
    recipients: [{ externalId }],
  });

  const userToken = jwt.sign(
    {
      user_email: userEmail,
      user_external_id: externalId,
      api_key: apiKey,
    },
    secretKey,
    { algorithm: 'HS256' },
  );

  const userClient = new UserClient({ token: userToken });

  const notification = await pollForNotification(userClient, broadcastTitle);

  await userClient.notifications.archiveNotification(notification.id);

  const archived = await userClient.notifications.fetchNotification(notification.id);
  if (!archived.data?.archivedAt) {
    throw new Error('Notification archive failed: archived_at is null.');
  }

  const logLine = `Archived Notification ID: ${notification.id}`;
  fs.writeFileSync('/home/user/myproject/output.log', logLine);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
