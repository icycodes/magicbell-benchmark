const axios = require('axios');
const jwt = require('jsonwebtoken');

async function run() {
  const runId = process.env.ZEALT_RUN_ID || 'test';
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const email = process.env.MAGICBELL_EMAIL;
  
  const externalId = `user-topic-sub-${runId}`;
  const [local, domain] = email.split('@');
  const userEmail = `${local}+topic-sub-${runId}@${domain}`;
  const topic = `updates-${runId}`;

  try {
    const res = await axios.post('https://api.magicbell.com/users', {
      user: { external_id: externalId, email: userEmail }
    }, {
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-API-SECRET': secretKey
      }
    });
    console.log("User created");
  } catch (e) {
    console.log("Create user error:", e.response ? e.response.data : e.message);
  }

  // generate JWT
  const userJwt = jwt.sign({ external_id: externalId }, secretKey);

  // subscribe
  try {
    const res = await axios.post(`https://api.magicbell.com/users/${externalId}/subscriptions`, {
      subscription: { topic: topic }
    }, {
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-API-SECRET': secretKey
      }
    });
    console.log("Subscription successful with API Secret");
    console.log(res.data);
  } catch (e) {
    console.log("Subscribe error:", e.response ? e.response.data : e.message);
  }
}

run();
