const { Client } = require('magicbell-js/project-client');

const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
const client = new Client({
  token: projectToken
});

const token = client.config.token;
const runId = process.env.ZEALT_RUN_ID;
const workflowKey = `test-workflow-${runId}`;

async function testEndpoints() {
  const urls = [
    `https://api.magicbell.com/v2/workflows/${workflowKey}`,
    `https://api.magicbell.com/workflows/${workflowKey}`,
    `https://api.magicbell.com/v2/workflows`,
    `https://api.magicbell.com/workflows`
  ];

  for (const url of urls) {
    console.log(`\n--- Testing DELETE on ${url} ---`);
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log(`Status: ${response.status}`);
      console.log('Headers:');
      for (const [key, value] of response.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      const text = await response.text();
      console.log(`Body: ${text}`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
}

testEndpoints();
