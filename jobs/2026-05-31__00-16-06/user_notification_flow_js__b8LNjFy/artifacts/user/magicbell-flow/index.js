const fs = require("fs/promises");
const path = require("path");
const jwt = require("jsonwebtoken");
const { Client: ProjectClient } = require("magicbell-js/project-client");
const { Client: UserClient } = require("magicbell-js/user-client");

const OUTPUT_DIR = "/home/user/magicbell-flow";
const LOG_PATH = path.join(OUTPUT_DIR, "flow.log");
const JWT_PATH = path.join(OUTPUT_DIR, "user_jwt.txt");

const REQUIRED_ENV_VARS = [
  "ZEALT_RUN_ID",
  "GMAIL_USER_NAME",
  "MAGICBELL_API_KEY",
  "MAGICBELL_SECRET_KEY",
  "MAGICBELL_PROJECT_TOKEN",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const listNotificationsByTitle = async (client, title) => {
  const response = await client.notifications.listNotifications({ limit: 50 });
  const notifications = response.data?.data ?? [];
  return notifications.find((notification) => notification.title === title) || null;
};

const getNotificationState = (notification) =>
  notification.readAt ? "read" : "unread";

const main = async () => {
  REQUIRED_ENV_VARS.forEach(ensureEnv);

  const runId = ensureEnv("ZEALT_RUN_ID");
  const gmailUser = ensureEnv("GMAIL_USER_NAME");
  const magicbellApiKey = ensureEnv("MAGICBELL_API_KEY");
  const magicbellSecretKey = ensureEnv("MAGICBELL_SECRET_KEY");
  const magicbellProjectToken = ensureEnv("MAGICBELL_PROJECT_TOKEN");

  const externalId = `usr_${runId}`;
  const email = `${gmailUser}+${runId}@gmail.com`;

  const userJwt = jwt.sign(
    {
      user_external_id: externalId,
      user_email: email,
      api_key: magicbellApiKey,
    },
    magicbellSecretKey,
    { algorithm: "HS256" }
  );

  await fs.writeFile(JWT_PATH, userJwt);

  const projectClient = new ProjectClient({ token: magicbellProjectToken });

  await projectClient.users.saveUser({
    externalId,
    email,
    firstName: "Test",
    lastName: "User",
  });

  const broadcastTitle = `Alert - ${runId}`;
  const broadcastContent = `This is a test notification for run ${runId}.`;

  const broadcastResponse = await projectClient.broadcasts.createBroadcast({
    title: broadcastTitle,
    content: broadcastContent,
    recipients: [{ externalId, email }],
  });

  const broadcastId = broadcastResponse.data?.id;
  if (!broadcastId) {
    throw new Error("Broadcast ID not returned from MagicBell API");
  }

  const userClient = new UserClient({ token: userJwt });

  let notification = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    notification = await listNotificationsByTitle(userClient, broadcastTitle);
    if (notification) {
      break;
    }
    await sleep(2000);
  }

  if (!notification) {
    throw new Error("Notification not found after broadcast creation");
  }

  const notificationId = notification.id;
  if (!notificationId) {
    throw new Error("Notification ID missing from response");
  }

  const initialState = getNotificationState(notification);
  if (initialState !== "unread") {
    throw new Error(`Expected notification to be unread, got: ${initialState}`);
  }

  await userClient.notifications.markNotificationRead(notificationId);

  const updatedNotification = await listNotificationsByTitle(
    userClient,
    broadcastTitle
  );

  if (!updatedNotification) {
    throw new Error("Notification not found after marking as read");
  }

  const updatedState = getNotificationState(updatedNotification);

  const logLines = [
    `Broadcast ID: ${broadcastId}`,
    `Notification ID: ${notificationId}`,
    `Notification Initial State: ${initialState}`,
    `Notification Updated State: ${updatedState}`,
  ];

  await fs.writeFile(LOG_PATH, `${logLines.join("\n")}\n`);
};

main().catch(async (error) => {
  await fs.writeFile(LOG_PATH, `Error: ${error.message}\n`);
  process.exitCode = 1;
});
