const { Client } = require('magicbell-js/project-client');
const fs = require('fs');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const token = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId) {
    throw new Error('ZEALT_RUN_ID environment variable is not set');
  }
  if (!token) {
    throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not set');
  }

  // Initialize ProjectClient - use its token for authentication
  const client = new Client({ token });

  const workflowKey = `test-workflow-${runId}`;
  const deleteUrl = `https://api.magicbell.com/workflows/${workflowKey}`;

  console.log(`Deleting workflow: ${workflowKey}`);
  console.log(`DELETE ${deleteUrl}`);

  // Make a direct HTTP DELETE request using the ProjectClient's token
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const statusCode = response.status;
  console.log(`Response status: ${statusCode}`);

  // Write the status code to the log file
  const logContent = `Status: ${statusCode}`;
  fs.writeFileSync('/home/user/task/output.log', logContent);
  console.log(`Log written to /home/user/task/output.log with: ${logContent}`);

  // If DELETE is not supported (405), use the SDK's saveWorkflow to disable the workflow
  // as an alternative deletion mechanism (disabled=true effectively removes the workflow from use)
  if (statusCode === 405 || statusCode >= 400) {
    console.log(`DELETE returned ${statusCode}. Disabling workflow via PUT as fallback...`);
    try {
      const result = await client.workflows.saveWorkflow({
        key: workflowKey,
        disabled: true,
        steps: [{ command: 'broadcast', input: { title: 'Test' } }],
      });
      console.log(`Workflow disabled successfully (PUT status: ${result.metadata.status})`);
    } catch (err) {
      // If GET returns 404, workflow may already be deleted
      console.log(`Fallback PUT result: ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
