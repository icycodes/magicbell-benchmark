const axios = require('axios');
const jwt = require('jsonwebtoken');

async function run() {
  const runId = process.env.ZEALT_RUN_ID || 'test';
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const externalId = `user-topic-sub-${runId}`;
  const topic = `updates-${runId}`;

  // generate JWT
  const userJwt = jwt.sign({ external_id: externalId }, secretKey);

  try {
    const res = await axios.post(`https://api.magicbell.com/subscriptions`, {
      subscription: { topic: topic, categories: [{slug: "*"}] }
    }, {
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-USER-JWT': userJwt
      }
    });
    console.log("Subscription successful with JWT");
    console.log(res.data);
  } catch (e) {
    console.log("Subscribe error:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
  }
}

run();
