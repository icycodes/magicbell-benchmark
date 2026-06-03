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

fetch('https://api.magicbell.com/v2/channels/user_preferences', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(async res => {
  console.log('Status:', res.status);
  console.log('Text:', await res.text());
}).catch(console.error);
