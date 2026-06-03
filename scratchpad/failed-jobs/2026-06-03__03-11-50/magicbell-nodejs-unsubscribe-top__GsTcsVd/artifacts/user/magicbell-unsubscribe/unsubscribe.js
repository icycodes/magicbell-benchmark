const jwt = require('jsonwebtoken');

const runId = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

if (!runId || !magicbellEmail || !apiKey || !secretKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const userEmail = `${magicbellEmail}+${runId}@gmail.com`;
const topic = `test-topic-${runId}`;

// Generate a User JWT
const token = jwt.sign(
  { user_email: userEmail },
  secretKey,
  { expiresIn: '1h' }
);

async function run() {
  try {
    let UserClient;
    try {
      // Try to load from magicbell-js/user-client (either the real one or aliased)
      const pkg = require('magicbell-js/user-client');
      UserClient = pkg.UserClient || pkg.Client;
    } catch (e) {
      // Fallback
      UserClient = require('magicbell').UserClient;
    }

    const client = new UserClient({
      apiKey: apiKey,
      token: token
    });

    if (client.subscriptions && typeof client.subscriptions.unsubscribe === 'function') {
      await client.subscriptions.unsubscribe(topic);
      console.log(`Successfully unsubscribed ${userEmail} from ${topic} using client.subscriptions.unsubscribe`);
    } else {
      console.log("client.subscriptions.unsubscribe is not available on this client version. Using fallback HTTP request...");
      // Use native fetch (Node 18+)
      const response = await fetch(`https://api.magicbell.com/subscriptions/${topic}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-MAGICBELL-API-KEY': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to unsubscribe: ${response.status} ${response.statusText} - ${text}`);
      }
      console.log(`Successfully unsubscribed ${userEmail} from ${topic}`);
    }
  } catch (err) {
    console.error('Error unsubscribing:', err.response?.body || err.message || err);
    process.exit(1);
  }
}

run();
