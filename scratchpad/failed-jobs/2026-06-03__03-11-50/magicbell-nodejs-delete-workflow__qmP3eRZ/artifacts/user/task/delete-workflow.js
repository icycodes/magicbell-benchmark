const fs = require('fs');
const { Client } = require('magicbell-js/project-client');

async function deleteWorkflow() {
  try {
    const runId = process.env.ZEALT_RUN_ID;
    if (!runId) {
      throw new Error('ZEALT_RUN_ID environment variable is not set');
    }

    const token = process.env.MAGICBELL_PROJECT_TOKEN;
    if (!token) {
      throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not set');
    }

    const workflowKey = `test-workflow-${runId}`;
    
    // Instantiate the ProjectClient
    const client = new Client({ token });

    // Use the client's internal configuration for the token
    const clientToken = client.config.token;

    // The SDK lacks a direct method to delete a workflow, so make a direct HTTP DELETE request
    const url = `https://api.magicbell.com/workflows/${workflowKey}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${clientToken}`,
        'Accept': 'application/json'
      }
    });

    const status = response.status;
    console.log(`Deleted workflow ${workflowKey}, status: ${status}`);

    // Save the deletion HTTP status code to a log file
    fs.writeFileSync('/home/user/task/output.log', `Status: ${status}\n`);
    console.log('Saved status to /home/user/task/output.log');
  } catch (error) {
    console.error('Error deleting workflow:', error);
    process.exit(1);
  }
}

deleteWorkflow();
