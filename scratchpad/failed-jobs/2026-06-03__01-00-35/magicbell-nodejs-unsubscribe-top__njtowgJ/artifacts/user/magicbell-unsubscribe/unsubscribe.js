const { Client } = require('magicbell-js/user-client');
const { RequestBuilder } = require('./node_modules/magicbell-js/dist/commonjs/user-client/http/transport/request-builder.js');
const { ContentType } = require('./node_modules/magicbell-js/dist/commonjs/user-client/http/types.js');
const { z } = require('zod');
const jwt = require('jsonwebtoken');

const runId = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

if (!runId || !magicbellEmail || !apiKey || !secretKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Construct the two possible emails
const email1 = `${magicbellEmail}+${runId}@gmail.com`;
const email2 = `${magicbellEmail.split('@')[0]}+${runId}@gmail.com`;

const emails = [email1, email2];
const topic = `test-topic-${runId}`;

async function unsubscribeEmail(email) {
  console.log(`Unsubscribing email: ${email} from topic: ${topic}`);

  // Generate User JWT
  const payload = {
    user_email: email,
    api_key: apiKey,
  };

  const token = jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    expiresIn: '1y',
  });

  // Instantiate Client
  const client = new Client({ token });

  // Dynamically add subscriptions.unsubscribe method
  client.subscriptions = {
    unsubscribe: async (topicName, data = {}, requestConfig) => {
      const request = new RequestBuilder()
        .setBaseUrl('https://api.magicbell.com') // Use v1 base URL
        .setConfig(client.config)
        .setMethod('POST')
        .setPath(`/subscriptions/${topicName}/unsubscribe`)
        .setRequestSchema(z.any())
        .addAccessTokenAuth(client.config.token, 'Bearer')
        .setRequestContentType(ContentType.Json)
        .addBody({ subscription: data })
        .addResponse({
          schema: z.any(),
          contentType: ContentType.Json,
          status: 200,
        })
        .build();
      return client.notifications.client.call(request);
    }
  };

  // Call unsubscribe
  const response = await client.subscriptions.unsubscribe(topic, {});
  console.log(`Response for ${email}:`, JSON.stringify(response));
}

async function main() {
  for (const email of emails) {
    try {
      await unsubscribeEmail(email);
    } catch (err) {
      console.error(`Failed to unsubscribe ${email}:`, err);
    }
  }
}

main();
