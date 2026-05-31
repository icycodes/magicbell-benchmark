const fs = require("fs/promises");
const path = require("path");
const { Client } = require("magicbell-js/project-client");

const OUTPUT_PATH = "/home/user/myproject/output.log";

const getEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const main = async () => {
  const runId = getEnv("ZEALT_RUN_ID");
  const gmailUserName = getEnv("GMAIL_USER_NAME");
  const token = getEnv("MAGICBELL_PROJECT_TOKEN");

  const client = new Client({ token });

  const externalId = `user_${runId}`;
  const email = `${gmailUserName}+${runId}@gmail.com`;

  await client.users.saveUser({
    externalId,
    email,
    firstName: "Test",
    lastName: "User",
  });

  const broadcastResponse = await client.broadcasts.createBroadcast({
    title: `Welcome to MagicBell ${runId}!`,
    content: `This is a test notification for run ${runId}.`,
    recipients: [{ externalId }],
  });

  const broadcastId = broadcastResponse?.data?.id;
  if (!broadcastId) {
    throw new Error("Broadcast ID was not returned by MagicBell.");
  }

  await fs.writeFile(OUTPUT_PATH, `Broadcast ID: ${broadcastId}\n`, "utf8");

  return broadcastId;
};

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  await fs.writeFile(OUTPUT_PATH, `Broadcast ID: ERROR - ${message}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
});
