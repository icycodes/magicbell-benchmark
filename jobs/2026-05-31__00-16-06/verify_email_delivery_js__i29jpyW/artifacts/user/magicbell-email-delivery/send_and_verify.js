const fs = require('fs');
const path = require('path');
const { Client: MagicBellClient } = require('magicbell-js/project-client');
const { google } = require('googleapis');

async function main() {
  const zealtRunId = process.env.ZEALT_RUN_ID;
  const gmailUserName = process.env.GMAIL_USER_NAME;
  const magicbellProjectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const gmailTokenJson = process.env.GMAIL_TOKEN_JSON;

  if (!zealtRunId || !gmailUserName || !magicbellProjectToken || !gmailTokenJson) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const externalId = `user_${zealtRunId}`;
  const email = `${gmailUserName}+${zealtRunId}@gmail.com`;

  console.log(`External ID: ${externalId}`);
  console.log(`Email: ${email}`);

  // Initialize MagicBell client
  const client = new MagicBellClient({
    token: magicbellProjectToken,
  });

  // Step 1: Create or update user
  console.log('Creating/updating user...');
  const userResponse = await client.users.saveUser({
    externalId: externalId,
    email: email,
  });
  console.log('User created/updated:', userResponse.data?.id || 'success');

  // Step 2: Send broadcast notification
  console.log('Sending broadcast notification...');
  const broadcastResponse = await client.broadcasts.createBroadcast({
    title: `Security Alert: Login from New Device [${zealtRunId}]`,
    content: `A login was detected on your account. If this wasn't you, please change your password. Run ID: ${zealtRunId}`,
    recipients: [
      {
        externalId: externalId,
        email: email,
      },
    ],
  });

  const broadcastId = broadcastResponse.data?.id;
  console.log('Broadcast ID:', broadcastId);

  // Step 3: Poll Gmail for the delivered email
  console.log('Polling Gmail for the email...');

  // Parse Gmail credentials
  const gmailCreds = JSON.parse(gmailTokenJson);

  // Set up OAuth2 client with the credentials
  const oauth2Client = new google.auth.OAuth2(
    gmailCreds.client_id,
    gmailCreds.client_secret,
    gmailCreds.token_uri
  );

  // Set credentials from the token JSON
  oauth2Client.setCredentials({
    access_token: gmailCreds.token,
    refresh_token: gmailCreds.refresh_token,
    token_uri: gmailCreds.token_uri,
    scope: gmailCreds.scopes ? gmailCreds.scopes.join(' ') : 'https://www.googleapis.com/auth/gmail.readonly',
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const expectedSubject = `Security Alert: Login from New Device [${zealtRunId}]`;
  const query = `to:${email} subject:"${expectedSubject}"`;

  const maxAttempts = 18; // 90 seconds / 5 seconds
  const pollInterval = 5000; // 5 seconds
  let foundEmail = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt}/${maxAttempts}...`);
    try {
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 5,
      });

      const messages = listResponse.data.messages;
      if (messages && messages.length > 0) {
        // Get the first matching message
        const msgResponse = await gmail.users.messages.get({
          userId: 'me',
          id: messages[0].id,
          format: 'full',
        });

        const headers = msgResponse.data.payload?.headers || [];
        const subjectHeader = headers.find((h) => h.name === 'Subject');
        const toHeader = headers.find((h) => h.name === 'To');

        foundEmail = {
          subject: subjectHeader?.value || '',
          to: toHeader?.value || '',
          id: messages[0].id,
        };
        console.log('Email found!');
        break;
      }
    } catch (err) {
      console.error(`Error polling Gmail (attempt ${attempt}):`, err.message);
    }

    // Wait before next poll
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  if (!foundEmail) {
    console.error('Email not found within the timeout period');
    // Write partial output
    const logContent = `Broadcast ID: ${broadcastId}\nEmail Received To: NOT_FOUND\nEmail Received Subject: NOT_FOUND\n`;
    fs.writeFileSync(path.join(__dirname, 'output.log'), logContent);
    process.exit(1);
  }

  // Step 4: Write results to output.log
  const logContent = [
    `Broadcast ID: ${broadcastId}`,
    `Email Received To: ${foundEmail.to}`,
    `Email Received Subject: ${foundEmail.subject}`,
  ].join('\n');

  fs.writeFileSync(path.join(__dirname, 'output.log'), logContent);
  console.log('Results written to output.log');
  console.log(logContent);
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});