const jwt = require('jsonwebtoken');

const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;
const email = process.env.MAGICBELL_EMAIL;
const runId = process.env.ZEALT_RUN_ID;

if (!apiKey || !secretKey || !email || !runId) {
  console.error('Missing required environment variables: MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY, MAGICBELL_EMAIL, ZEALT_RUN_ID');
  process.exit(1);
}

const payload = {
  user_email: `${email}+${runId}@gmail.com`,
  user_external_id: `user_${runId}`,
  api_key: apiKey,
};

const token = jwt.sign(payload, secretKey, {
  algorithm: 'HS256',
  expiresIn: '1y',
});

console.log(`User JWT: ${token}`);
