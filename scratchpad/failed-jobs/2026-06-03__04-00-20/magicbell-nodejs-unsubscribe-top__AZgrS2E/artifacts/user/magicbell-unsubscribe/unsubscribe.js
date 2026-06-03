const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  // Read environment variables
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  if (!runId || !magicbellEmail || !apiKey || !secretKey) {
    console.error('Missing required environment variables: ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY');
    process.exit(1);
  }

  // Construct the user's email and topic name
  const userEmail = `${magicbellEmail}+${runId}@gmail.com`;
  const topic = `test-topic-${runId}`;

  console.log(`User email: ${userEmail}`);
  console.log(`Topic: ${topic}`);

  // Generate a User JWT
  const token = jwt.sign(
    {
      user_email: userEmail,
      api_key: apiKey,
    },
    secretKey,
    {
      algorithm: 'HS256',
    }
  );

  // Instantiate the UserClient with the JWT
  const client = new Client({
    token: token,
  });

  // The magicbell-js/user-client (v1.7.0) does not include a subscriptions service,
  // so we use the REST API directly with the client's authentication token.
  // Endpoint: POST /v2/subscriptions/{topic}/unsubscribe
  const baseUrl = 'https://api.magicbell.com/v2';
  const url = `${baseUrl}/subscriptions/${encodeURIComponent(topic)}/unsubscribe`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Failed to unsubscribe from topic '${topic}': ${response.status} ${response.statusText}`);
    console.error(`Response: ${errorBody}`);
    process.exit(1);
  }

  console.log(`Successfully unsubscribed user ${userEmail} from topic '${topic}'`);

  // Also print the response data if any
  const responseData = await response.text();
  if (responseData) {
    console.log(`Response: ${responseData}`);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});