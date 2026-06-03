const jwt = require("jsonwebtoken");
const { Client } = require("magicbell-js/user-client");

const runId = process.env.ZEALT_RUN_ID;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;
const magicbellEmail = process.env.MAGICBELL_EMAIL;

const notificationId = process.argv[2];

if (!notificationId) {
  console.error("Usage: node fetch.js <notification_id>");
  process.exit(1);
}

const token = jwt.sign(
  {
    external_id: `user_${runId}`,
    user_email: `${magicbellEmail}+user_${runId}@gmail.com`,
    api_key: apiKey,
  },
  secretKey,
  { algorithm: "HS256" }
);

const client = new Client({
  token: token,
});

async function main() {
  const response = await client.notifications.fetchNotification(notificationId);
  console.log(`Title: ${response.data.title}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});