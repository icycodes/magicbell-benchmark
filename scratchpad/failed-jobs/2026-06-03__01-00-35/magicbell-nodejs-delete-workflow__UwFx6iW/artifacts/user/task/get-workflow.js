const { Client } = require('magicbell-js/project-client');

const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
const client = new Client({
  token: projectToken
});

const token = client.config.token;
const runId = process.env.ZEALT_RUN_ID;
const workflowKey = `test-workflow-${runId}`;

async function getWorkflow() {
  const url = `https://api.magicbell.com/v2/workflows/${workflowKey}`;
  console.log(`Sending GET request to: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  
  console.log(`Status: ${response.status}`);
  const text = await response.text();
  console.log(`Body: ${text}`);
}

getWorkflow();
