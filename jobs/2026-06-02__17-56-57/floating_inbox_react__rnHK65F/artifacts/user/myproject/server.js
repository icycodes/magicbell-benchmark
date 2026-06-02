import express from "express";
import jwt from "jsonwebtoken";

const app = express();
const port = 3001;

const {
  MAGICBELL_EMAIL,
  MAGICBELL_PROJECT_TOKEN,
  MAGICBELL_API_KEY,
  MAGICBELL_SECRET_KEY,
  ZEALT_RUN_ID
} = process.env;

const requireEnv = (key, value) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
};

requireEnv("MAGICBELL_EMAIL", MAGICBELL_EMAIL);
requireEnv("MAGICBELL_PROJECT_TOKEN", MAGICBELL_PROJECT_TOKEN);
requireEnv("MAGICBELL_API_KEY", MAGICBELL_API_KEY);
requireEnv("MAGICBELL_SECRET_KEY", MAGICBELL_SECRET_KEY);
requireEnv("ZEALT_RUN_ID", ZEALT_RUN_ID);

const [localPart, domainPart] = MAGICBELL_EMAIL.split("@");
const userEmail = `${localPart}+fi-${ZEALT_RUN_ID}@${domainPart}`;
const userExternalId = `user-fi-${ZEALT_RUN_ID}`;
const broadcastTitle = `Floating Inbox - ${ZEALT_RUN_ID}`;

const magicbellBaseUrl = "https://api.magicbell.com/v2";
const magicbellHeaders = {
  "Content-Type": "application/json",
  "X-MAGICBELL-API-KEY": MAGICBELL_API_KEY,
  "X-MAGICBELL-API-SECRET": MAGICBELL_SECRET_KEY
};

const upsertUser = async () => {
  const body = JSON.stringify({
    external_id: userExternalId,
    email: userEmail
  });

  const createResponse = await fetch(`${magicbellBaseUrl}/users`, {
    method: "POST",
    headers: magicbellHeaders,
    body
  });

  if (createResponse.ok) {
    return;
  }

  if (createResponse.status === 422) {
    const updateResponse = await fetch(
      `${magicbellBaseUrl}/users/${encodeURIComponent(userExternalId)}`,
      {
        method: "PUT",
        headers: magicbellHeaders,
        body
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update MagicBell user: ${updateResponse.status} ${errorText}`);
    }

    return;
  }

  const errorText = await createResponse.text();
  throw new Error(`Failed to create MagicBell user: ${createResponse.status} ${errorText}`);
};

const createSeedBroadcast = async () => {
  const body = JSON.stringify({
    title: broadcastTitle,
    content: `Welcome to the Floating Inbox demo for ${ZEALT_RUN_ID}.`,
    recipients: {
      external_id: [userExternalId]
    }
  });

  const response = await fetch(`${magicbellBaseUrl}/broadcasts`, {
    method: "POST",
    headers: magicbellHeaders,
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create MagicBell broadcast: ${response.status} ${errorText}`);
  }
};

const ensureMagicBellSetup = async () => {
  await upsertUser();
  await createSeedBroadcast();
};

app.get("/token", (req, res) => {
  const token = jwt.sign(
    {
      user_email: userEmail,
      user_external_id: userExternalId,
      api_key: MAGICBELL_PROJECT_TOKEN
    },
    MAGICBELL_SECRET_KEY,
    {
      algorithm: "HS256",
      expiresIn: "365d"
    }
  );

  res.json({ token });
});

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

const start = async () => {
  await ensureMagicBellSetup();

  app.listen(port, () => {
    console.log(`MagicBell demo backend running on port ${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
