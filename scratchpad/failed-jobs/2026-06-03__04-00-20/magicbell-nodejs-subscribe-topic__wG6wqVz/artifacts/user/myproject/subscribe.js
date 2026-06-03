const jwt = require('jsonwebtoken');
const https = require('https');

// Read environment variables
const runId = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

// Derive user details
const externalId = `user-topic-sub-${runId}`;
const [localPart, domain] = magicbellEmail.split('@');
const userEmail = `${localPart}+topic-sub-${runId}@${domain}`;
const topicName = `updates-${runId}`;

console.log(`Run ID: ${runId}`);
console.log(`External ID: ${externalId}`);
console.log(`User Email: ${userEmail}`);
console.log(`Topic Name: ${topicName}`);

// Generate User JWT with API key in header
const userJwtPayload = {
  external_id: externalId,
  email: userEmail,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

const userJwt = jwt.sign(userJwtPayload, secretKey, {
  algorithm: 'HS256',
  header: { kid: apiKey },
});
console.log(`User JWT: ${userJwt}`);

// Helper function to make HTTPS requests
function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  try {
    // Step 1: Create/save the user using the Project API (PUT /v2/users)
    console.log('\n--- Creating/saving user ---');
    const createUserOptions = {
      hostname: 'api.magicbell.com',
      path: '/v2/users',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    };

    const userPayload = {
      user: {
        external_id: externalId,
        email: userEmail,
      },
    };

    const createUserResponse = await makeRequest(createUserOptions, userPayload);
    console.log(`Create user status: ${createUserResponse.statusCode}`);
    console.log(`Create user response: ${createUserResponse.body}`);

    // Step 2: Subscribe the user to the topic using the Subscriptions API
    console.log('\n--- Subscribing user to topic ---');
    const subscribeOptions = {
      hostname: 'api.magicbell.com',
      path: '/v2/subscriptions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-USER-EXTERNAL-ID': externalId,
      },
    };

    const subscribePayload = {
      subscription: {
        topic: topicName,
      },
    };

    const subscribeResponse = await makeRequest(subscribeOptions, subscribePayload);
    console.log(`Subscribe status: ${subscribeResponse.statusCode}`);
    console.log(`Subscribe response: ${subscribeResponse.body}`);

    if (subscribeResponse.statusCode >= 200 && subscribeResponse.statusCode < 300) {
      console.log('\nSubscription successful');
    } else {
      // Try alternative payload format (without subscription wrapper)
      console.log('\nTrying alternative subscription format...');
      const altPayload = {
        topic: topicName,
      };

      const altResponse = await makeRequest(subscribeOptions, altPayload);
      console.log(`Alt subscribe status: ${altResponse.statusCode}`);
      console.log(`Alt subscribe response: ${altResponse.body}`);

      if (altResponse.statusCode >= 200 && altResponse.statusCode < 300) {
        console.log('\nSubscription successful');
      } else {
        // Try with X-MAGICBELL-USER-EMAIL header instead
        console.log('\nTrying with X-MAGICBELL-USER-EMAIL header...');
        const alt2Options = {
          hostname: 'api.magicbell.com',
          path: '/v2/subscriptions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-MAGICBELL-API-KEY': apiKey,
            'X-MAGICBELL-USER-EMAIL': userEmail,
          },
        };

        const alt2Response = await makeRequest(alt2Options, subscribePayload);
        console.log(`Alt2 subscribe status: ${alt2Response.statusCode}`);
        console.log(`Alt2 subscribe response: ${alt2Response.body}`);

        if (alt2Response.statusCode >= 200 && alt2Response.statusCode < 300) {
          console.log('\nSubscription successful');
        } else {
          // Try with User JWT as Bearer token
          console.log('\nTrying with User JWT as Bearer token...');
          const alt3Options = {
            hostname: 'api.magicbell.com',
            path: '/v2/subscriptions',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userJwt}`,
              'X-MAGICBELL-API-KEY': apiKey,
            },
          };

          const alt3Response = await makeRequest(alt3Options, subscribePayload);
          console.log(`Alt3 subscribe status: ${alt3Response.statusCode}`);
          console.log(`Alt3 subscribe response: ${alt3Response.body}`);

          if (alt3Response.statusCode >= 200 && alt3Response.statusCode < 300) {
            console.log('\nSubscription successful');
          } else {
            console.log('\nAll subscription attempts returned non-2xx status codes.');
            process.exit(1);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();