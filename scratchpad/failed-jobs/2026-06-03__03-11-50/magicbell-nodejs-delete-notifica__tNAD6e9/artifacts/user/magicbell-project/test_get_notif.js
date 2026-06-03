const https = require('https');
const runId = process.env.ZEALT_RUN_ID;
const email = process.env.MAGICBELL_EMAIL.replace('@', `+${runId}@`);

const options = {
  hostname: 'api.magicbell.com',
  path: `/notifications?user_email=${encodeURIComponent(email)}`,
  method: 'GET',
  headers: {
    'X-MAGICBELL-API-KEY': process.env.MAGICBELL_API_KEY,
    'X-MAGICBELL-API-SECRET': process.env.MAGICBELL_SECRET_KEY,
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(res.statusCode, data));
});
req.end();
