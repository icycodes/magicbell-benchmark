const { google } = require('googleapis');
const tokenJson = process.env.GMAIL_TOKEN_JSON;
const token = JSON.parse(tokenJson);
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
gmail.users.messages.list({ userId: 'me', maxResults: 1 }).then(res => console.log(res.data)).catch(console.error);
