const https = require('https');
const options = {
  hostname: 'api.magicbell.com',
  path: `/broadcasts/019e8b88-38be-7695-8321-d1c68d0cfe70/notifications`,
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
