const { Client } = require('magicbell-js/user-client');
const jwt = require('jsonwebtoken');

const runId = process.env.ZEALT_RUN_ID || 'test';
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

const userEmail = magicbellEmail.split('@')[0] + '+' + runId + '@gmail.com';
const token = jwt.sign(
  { user_email: userEmail, api_key: apiKey }, 
  secretKey, 
  { algorithm: 'HS256' }
);

const client = new Client({ token });

client.channels.fetchUserPreferences().then(res => {
  console.log('Success:', res.data);
}).catch(console.error);
