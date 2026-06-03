const { Client } = require('magicbell-js/user-client');
const jwt = require('jsonwebtoken');

const runId = process.env.ZEALT_RUN_ID || 'test';
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

const userEmail = `${magicbellEmail}+${runId}@gmail.com`;
const token = jwt.sign({ user_email: userEmail }, secretKey, { algorithm: 'HS256' });

const client = new Client({ token });

// Intercept fetch
const originalFetch = global.fetch;
global.fetch = async (...args) => {
  console.log('FETCH CALLED:', args);
  return originalFetch(...args);
};

client.channels.fetchUserPreferences().then(console.log).catch(console.error);
