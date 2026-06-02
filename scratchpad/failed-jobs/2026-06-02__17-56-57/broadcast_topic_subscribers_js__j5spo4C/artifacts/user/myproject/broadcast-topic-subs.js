const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const { Client: ProjectClient } = require("magicbell-js/project-client");

const runId = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
const apiKey = process.env.MAGICBELL_API_KEY;
const apiSecret = process.env.MAGICBELL_API_SECRET || apiKey;

if (!runId || !magicbellEmail || !projectToken || !apiKey) {
  throw new Error(
    "Missing required environment variables: ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_PROJECT_TOKEN, MAGICBELL_API_KEY"
  );
}

const emailParts = magicbellEmail.split("@");
if (emailParts.length !== 2) {
  throw new Error("MAGICBELL_EMAIL must be a valid email address.");
}

const [localPart, domainPart] = emailParts;
const topic = `topic-${runId}`;

const email1 = `${localPart}+topic-subs-js-1-${runId}@${domainPart}`;
const email2 = `${localPart}+topic-subs-js-2-${runId}@${domainPart}`;

const user1ExternalId = `user-topic-subs-js-1-${runId}`;
const user2ExternalId = `user-topic-subs-js-2-${runId}`;

const client = new ProjectClient({ token: projectToken });

const subscribeToTopic = (externalId) =>
  new Promise((resolve, reject) => {
    const payload = JSON.stringify({ subscription: { topic } });
    const hmac = crypto
      .createHmac("sha256", apiSecret)
      .update(externalId)
      .digest("hex");

    const request = https.request(
      {
        hostname: "api.magicbell.com",
        path: "/subscriptions",
        method: "POST",
        headers: {
          "X-MAGICBELL-API-KEY": apiKey,
          "X-MAGICBELL-USER-EXTERNAL-ID": externalId,
          "X-MAGICBELL-USER-HMAC": hmac,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          if (response.statusCode !== 200) {
            reject(
              new Error(
                `Subscription failed for ${externalId} with status ${response.statusCode}: ${data}`
              )
            );
            return;
          }

          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("error", (error) => {
      reject(error);
    });

    request.write(payload);
    request.end();
  });

const run = async () => {
  await client.users.saveUser({
    externalId: user1ExternalId,
    email: email1,
    firstName: "TopicSubs",
    lastName: `One-${runId}`,
  });

  await client.users.saveUser({
    externalId: user2ExternalId,
    email: email2,
    firstName: "TopicSubs",
    lastName: `Two-${runId}`,
  });

  await subscribeToTopic(user1ExternalId);
  await subscribeToTopic(user2ExternalId);

  const { data: broadcast } = await client.broadcasts.createBroadcast({
    title: `Topic Subs JS - ${runId}`,
    content: `Broadcast to topic subscribers for run ${runId}.`,
    topic,
    recipients: [{ topic: { subscribers: true } }],
  });

  fs.writeFileSync(
    "/home/user/myproject/output.log",
    `Broadcast ID: ${broadcast.id}`
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
