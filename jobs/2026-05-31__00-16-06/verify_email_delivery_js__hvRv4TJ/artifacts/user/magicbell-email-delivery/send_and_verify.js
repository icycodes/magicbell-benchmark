const fs = require('fs');
const { google } = require('googleapis');
const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const gmailUserName = process.env.GMAIL_USER_NAME;
  const magicbellProjectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const gmailTokenJson = process.env.GMAIL_TOKEN_JSON;

  if (!runId || !gmailUserName || !magicbellProjectToken || !gmailTokenJson) {
    throw new Error("Missing required environment variables");
  }

  const externalId = `user_${runId}`;
  const email = `${gmailUserName}+${runId}@gmail.com`;

  const client = new Client({ token: magicbellProjectToken });

  console.log(`Creating/updating user: ${externalId} with email ${email}`);
  await client.users.saveUser({
    externalId: externalId,
    email: email
  });

  const title = `Security Alert: Login from New Device [${runId}]`;
  const content = `A login was detected on your account. If this wasn't you, please change your password. Run ID: ${runId}`;

  console.log(`Sending broadcast...`);
  const broadcastRes = await client.broadcasts.createBroadcast({
    title,
    content,
    recipients: [{ externalId }]
  });

  const broadcastId = broadcastRes.data.id;
  console.log(`Broadcast created with ID: ${broadcastId}`);

  // Setup Gmail API
  const token = JSON.parse(gmailTokenJson);
  const oauth2Client = new google.auth.OAuth2(
    token.client_id,
    token.client_secret
  );
  oauth2Client.setCredentials({
    access_token: token.token,
    refresh_token: token.refresh_token,
    expiry_date: new Date(token.expiry).getTime()
  });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  console.log(`Polling Gmail for email to ${email} with subject "${title}"...`);
  
  const query = `to:${email} subject:"${title}"`;
  
  let foundMessage = null;
  let attempts = 0;
  const maxAttempts = 18; // 90 seconds / 5 seconds
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts}...`);
    
    try {
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 1
      });
      
      if (res.data.messages && res.data.messages.length > 0) {
        const messageId = res.data.messages[0].id;
        console.log(`Found message ID: ${messageId}. Fetching details...`);
        
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'metadata',
          metadataHeaders: ['To', 'Subject']
        });
        
        const headers = msgRes.data.payload.headers;
        const toHeader = headers.find(h => h.name.toLowerCase() === 'to')?.value;
        const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value;
        
        foundMessage = {
          to: toHeader,
          subject: subjectHeader
        };
        break;
      }
    } catch (err) {
      console.error(`Error querying Gmail API: ${err.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  if (!foundMessage) {
    throw new Error("Email not found within timeout");
  }
  
  console.log(`Email successfully verified!`);
  
  const logOutput = [
    `Broadcast ID: ${broadcastId}`,
    `Email Received To: ${foundMessage.to}`,
    `Email Received Subject: ${foundMessage.subject}`
  ].join('\n') + '\n';
  
  fs.writeFileSync('/home/user/magicbell-email-delivery/output.log', logOutput);
  console.log(`Results written to output.log`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
