const axios = require('axios');

async function run() {
  const runId = process.env.ZEALT_RUN_ID || 'test';
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const externalId = `user-topic-sub-${runId}`;
  const topic = `updates-${runId}`;

  try {
    const res = await axios.post(`https://api.magicbell.com/subscriptions`, {
      subscription: { topic: topic, categories: [{slug: "*"}] }
    }, {
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-API-SECRET': secretKey,
        'X-MAGICBELL-USER-EXTERNAL-ID': externalId
      }
    });
    console.log("Subscription successful");
    console.log(res.data);
  } catch (e) {
    console.log("Subscribe error:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
  }
}

run();
