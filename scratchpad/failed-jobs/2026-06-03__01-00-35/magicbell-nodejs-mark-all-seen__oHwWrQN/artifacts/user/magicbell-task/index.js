const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');
const { RequestBuilder } = require('./node_modules/magicbell-js/dist/commonjs/user-client/http/transport/request-builder.js');
const z = require('zod');

async function main() {
  try {
    // 1. Read environment variables
    const rawEmail = process.env.MAGICBELL_EMAIL;
    const runId = process.env.ZEALT_RUN_ID;
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;

    if (!rawEmail || !runId || !apiKey || !secretKey) {
      throw new Error('Missing required environment variables: MAGICBELL_EMAIL, ZEALT_RUN_ID, MAGICBELL_API_KEY, or MAGICBELL_SECRET_KEY.');
    }

    // 2. Construct target user's email in plus format
    // If MAGICBELL_EMAIL contains an '@', extract the local part (before the '@') to ensure a valid email address is constructed.
    const emailPrefix = rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail;
    const userEmail = `${emailPrefix}+${runId}@gmail.com`;
    console.log(`Constructed Target User Email: ${userEmail}`);

    // 3. Generate User JWT
    const payload = {
      user_email: userEmail,
      api_key: apiKey
    };
    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
    console.log('Successfully generated User JWT.');

    // 4. Initialize UserClient
    const client = new Client({ token });
    // Disable response validation to avoid any strict schema validation issues
    client.config.validation = { responseValidation: false };

    // 5. Build and execute request to mark all notifications as seen
    const request = new RequestBuilder()
      .setBaseUrl(client.config.baseUrl || 'https://api.magicbell.com')
      .setConfig(client.config)
      .setMethod('POST')
      .setPath('/notifications/seen')
      .setRequestSchema(z.any())
      .addAccessTokenAuth(client.config.token, 'Bearer')
      .setRequestContentType('json')
      .addResponse({
        schema: z.any(),
        contentType: 'json',
        status: 204
      })
      .build();

    console.log('Marking all notifications as seen...');
    await client.notifications.client.call(request);

    console.log(`Success: All notifications have been marked as seen for user ${userEmail}.`);
  } catch (error) {
    console.error('Error occurred:', error.message || error);
    process.exit(1);
  }
}

main();
