const fs = require("fs");
const jwt = require("jsonwebtoken");

const {
  MAGICBELL_EMAIL,
  MAGICBELL_PROJECT_TOKEN,
  MAGICBELL_API_KEY,
  MAGICBELL_SECRET_KEY,
  ZEALT_RUN_ID,
} = process.env;

if (!MAGICBELL_EMAIL) {
  throw new Error("Missing MAGICBELL_EMAIL environment variable.");
}
if (!MAGICBELL_PROJECT_TOKEN) {
  throw new Error("Missing MAGICBELL_PROJECT_TOKEN environment variable.");
}
if (!MAGICBELL_API_KEY) {
  throw new Error("Missing MAGICBELL_API_KEY environment variable.");
}
if (!MAGICBELL_SECRET_KEY) {
  throw new Error("Missing MAGICBELL_SECRET_KEY environment variable.");
}
if (!ZEALT_RUN_ID) {
  throw new Error("Missing ZEALT_RUN_ID environment variable.");
}

const [emailLocal, emailDomain] = MAGICBELL_EMAIL.split("@");
if (!emailLocal || !emailDomain) {
  throw new Error("MAGICBELL_EMAIL must be a valid email address.");
}

const userEmail = `${emailLocal}+jwt-node-${ZEALT_RUN_ID}@${emailDomain}`;
const userExternalId = `user-jwt-node-${ZEALT_RUN_ID}`;

const upsertUser = async () => {
  const response = await fetch("https://api.magicbell.com/v2/users", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${MAGICBELL_PROJECT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: userExternalId,
      email: userEmail,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MagicBell user upsert failed (${response.status}): ${errorText}`);
  }

  return response.json();
};

const generateUserJwt = () =>
  jwt.sign(
    {
      user_email: userEmail,
      user_external_id: userExternalId,
      api_key: MAGICBELL_API_KEY,
    },
    MAGICBELL_SECRET_KEY,
    {
      algorithm: "HS256",
      expiresIn: "1y",
    }
  );

const writeOutput = (token) => {
  const outputLine = `User JWT: ${token}`;
  fs.writeFileSync("/home/user/myproject/output.log", `${outputLine}\n`, "utf8");
};

const main = async () => {
  await upsertUser();
  const token = generateUserJwt();
  writeOutput(token);

  console.log(`Generated User JWT for ${userEmail}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
