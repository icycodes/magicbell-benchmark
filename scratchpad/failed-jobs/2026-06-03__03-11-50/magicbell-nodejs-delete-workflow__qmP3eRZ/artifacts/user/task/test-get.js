const { Client } = require('magicbell-js/project-client');

async function getWorkflow() {
  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  const runId = process.env.ZEALT_RUN_ID;
  const workflowKey = `test-workflow-${runId}`;
  
  const client = new Client({ token });
  try {
    const response = await client.workflows.fetchWorkflow({
      // requestConfig?
    });
    console.log("SDK Fetch Workflow response:", response);
  } catch (e) {
    console.error("SDK Error:", e);
  }
}

getWorkflow();
