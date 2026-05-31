const fs = require('fs/promises');
const path = require('path');
const { google } = require('googleapis');
const { Client } = require('magicbell-js/project-client');

const REQUIRED_ENV = [
  'ZEALT_RUN_ID',
  'GMAIL_USER_NAME',
  'GMAIL_TOKEN_JSON',
  'MAGICBELL_PROJECT_TOKEN',
];

const OUTPUT_PATH = path.join(__dirname, 'output.log');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getHeaderValue = (headers, name) => {
  const match = headers.find((header) => header.name.toLowerCase() === name.toLowerCase());
  return match ? match.value : '';
};

const ensureEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const buildGmailClient = async () => {
  const token = JSON.parse(process.env.GMAIL_TOKEN_JSON);
  const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
  oauth2Client.setCredentials({
    refresh_token: token.refresh_token,
    access_token: token.access_token,
    expiry_date: token.expiry_date,
  });
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

const pollForEmail = async ({ gmail, query, timeoutMs, intervalMs }) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 5,
    });

    const messages = listResponse.data.messages || [];
    if (messages.length > 0) {
      const messageId = messages[0].id;
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['To', 'Subject'],
      });
      return messageResponse.data;
    }

    await sleep(intervalMs);
  }

  throw new Error('Timed out waiting for email delivery.');
};

const main = async () => {
  ensureEnv();

  const runId = process.env.ZEALT_RUN_ID;
  const gmailUserName = process.env.GMAIL_USER_NAME;
  const externalId = `user_${runId}`;
  const email = `${gmailUserName}+${runId}@gmail.com`;

  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });

  await client.users.saveUser({
    externalId,
    email,
  });

  const title = `Security Alert: Login from New Device [${runId}]`;
  const content = `A login was detected on your account. If this wasn't you, please change your password. Run ID: ${runId}`;

  const { data: broadcast } = await client.broadcasts.createBroadcast({
    title,
    content,
    recipients: [
      {
        externalId,
        email,
      },
    ],
  });

  const gmail = await buildGmailClient();
  const query = `subject:"${title}" to:${email}`;

  const message = await pollForEmail({
    gmail,
    query,
    timeoutMs: 90000,
    intervalMs: 5000,
  });

  const headers = message.payload?.headers || [];
  const receivedTo = getHeaderValue(headers, 'To');
  const receivedSubject = getHeaderValue(headers, 'Subject');

  const outputLines = [
    `Broadcast ID: ${broadcast.id}`,
    `Email Received To: ${receivedTo || email}`,
    `Email Received Subject: ${receivedSubject || title}`,
  ];

  await fs.writeFile(OUTPUT_PATH, `${outputLines.join('\n')}\n`, 'utf8');
};

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  await fs.writeFile(OUTPUT_PATH, `Error: ${message}\n`, 'utf8');
  process.exit(1);
});
