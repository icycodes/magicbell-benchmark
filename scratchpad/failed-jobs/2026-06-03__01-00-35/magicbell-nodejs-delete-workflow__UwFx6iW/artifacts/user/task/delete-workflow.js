const { Client } = require('magicbell-js/project-client');
const fs = require('fs');

const runId = process.env.ZEALT_RUN_ID;
if (!runId) {
  console.error('Error: ZEALT_RUN_ID environment variable is not defined.');
  process.exit(1);
}

const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
if (!projectToken) {
  console.error('Error: MAGICBELL_PROJECT_TOKEN environment variable is not defined.');
  process.exit(1);
}

const workflowKey = `test-workflow-${runId}`;
console.log(`Target workflow key: ${workflowKey}`);

// Use magicbell-js ProjectClient to authenticate and retrieve the token
const client = new Client({
  token: projectToken
});

const token = client.config.token;
if (!token) {
  console.error('Error: Token could not be retrieved from ProjectClient configuration.');
  process.exit(1);
}

async function deleteWorkflow() {
  // Let's try the URL with /v2 first, as Environment.DEFAULT uses /v2
  const urlV2 = `https://api.magicbell.com/v2/workflows/${workflowKey}`;
  console.log(`Sending DELETE request to: ${urlV2}`);
  
  let response = await fetch(urlV2, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  let statusCode = response.status;
  let responseText = await response.text();
  console.log(`HTTP Status Code (v2): ${statusCode}`);
  console.log(`Response Text (v2): ${responseText}`);

  if (statusCode === 405 || statusCode === 404) {
    // If /v2 didn't work or returned 405/404, let's try the non-v2 URL as mentioned in the hint
    const urlNonV2 = `https://api.magicbell.com/workflows/${workflowKey}`;
    console.log(`Sending DELETE request to non-v2 URL: ${urlNonV2}`);
    
    response = await fetch(urlNonV2, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    statusCode = response.status;
    responseText = await response.text();
    console.log(`HTTP Status Code (non-v2): ${statusCode}`);
    console.log(`Response Text (non-v2): ${responseText}`);
  }

  const logFilePath = '/home/user/task/output.log';
  fs.writeFileSync(logFilePath, `Status: ${statusCode}\n`);
  console.log(`Saved status code ${statusCode} to ${logFilePath}`);
}

deleteWorkflow().catch(err => {
  console.error('Error deleting workflow:', err);
  process.exit(1);
});
