const fs = require('fs');
const path = require('path');

async function main() {
  // Read environment variables
  const runId = process.env.ZEALT_RUN_ID;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId) {
    throw new Error('ZEALT_RUN_ID environment variable is not set');
  }
  if (!projectToken) {
    throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not set');
  }

  // Import the ProjectClient
  const { Client } = await import('magicbell-js/project-client');

  // Create a ProjectClient instance with the token
  const client = new Client({
    token: projectToken,
  });

  // First, try to list workflows to verify auth works
  console.log('Testing authentication by listing workflows...');
  try {
    const listResponse = await client.workflows.fetchWorkflows();
    console.log('List workflows status:', listResponse.metadata.status);
    console.log('List workflows data:', JSON.stringify(listResponse.data, null, 2));
  } catch (err) {
    console.log('List workflows error:', err.message);
  }

  // The SDK's WorkflowsService does not have a deleteWorkflow method,
  // so we use the client's internal token to make a direct HTTP DELETE request.
  const workflowKey = `test-workflow-${runId}`;

  // Try DELETE with the v2 base URL (matching the SDK's Environment.DEFAULT)
  const url = `https://api.magicbell.com/v2/workflows/${workflowKey}`;
  console.log(`\nDeleting workflow: ${workflowKey}`);
  console.log(`DELETE ${url}`);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${client.config.token}`,
      'Content-Type': 'application/json',
    },
  });

  const statusCode = response.status;
  const responseText = await response.text();
  console.log(`Response status: ${statusCode}`);
  console.log(`Response body: ${responseText}`);

  // Write the status code to the output log file
  const logContent = `Status: ${statusCode}`;
  const logPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(logPath, logContent);
  console.log(`Written to ${logPath}: ${logContent}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});