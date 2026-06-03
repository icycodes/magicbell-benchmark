const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');

async function run() {
  const runId = process.env.ZEALT_RUN_ID;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const email = process.env.MAGICBELL_EMAIL;
  
  if (!runId || !apiKey || !secretKey || !email) {
    console.error("Missing required environment variables");
    return;
  }

  const externalId = `user-topic-sub-${runId}`;
  const [local, domain] = email.split('@');
  const userEmail = `${local}+topic-sub-${runId}@${domain}`;
  const topic = `updates-${runId}`;

  // Generate a User JWT using the jsonwebtoken package
  const userJwt = jwt.sign({ external_id: externalId, api_key: apiKey }, secretKey);
  console.log("Generated User JWT:", userJwt);

  try {
    // 1. Create or update the user
    await axios.post('https://api.magicbell.com/users', {
      user: { external_id: externalId, email: userEmail }
    }, {
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-API-SECRET': secretKey
      }
    });
    console.log(`User created/updated: ${userEmail} (ext ID: ${externalId})`);

    // 2. Subscribe the user to the topic
    const res = await axios.post('https://api.magicbell.com/subscriptions', {
      subscription: { topic: topic, categories: [{slug: "*"}] }
    }, {
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-API-SECRET': secretKey,
        'X-MAGICBELL-USER-EXTERNAL-ID': externalId
      }
    });
    
    console.log("Subscription successful");
    fs.writeFileSync('/home/user/myproject/output.log', "Subscription successful\n" + JSON.stringify(res.data) + "\n");
    
  } catch (e) {
    const errorMsg = "Error: " + (e.response ? JSON.stringify(e.response.data) : e.message);
    console.error(errorMsg);
    fs.writeFileSync('/home/user/myproject/output.log', errorMsg + "\n");
  }
}

run();
