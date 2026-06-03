const { MagicBell } = require('magicbell-js');

async function run() {
  const runId = process.env.ZEALT_RUN_ID || 'test';
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  
  const externalId = `user-topic-sub-${runId}`;
  const topic = `updates-${runId}`;

  const magicbell = new MagicBell({
    apiKey: apiKey,
    apiSecret: secretKey
  });

  try {
    const res = await magicbell.users.create({
      external_id: externalId
    });
    console.log(res);
  } catch (e) {
    console.log(e);
  }
}

run();
