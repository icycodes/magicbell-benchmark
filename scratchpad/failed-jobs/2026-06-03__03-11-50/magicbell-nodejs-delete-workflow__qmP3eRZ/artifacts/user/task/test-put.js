const { Client } = require('magicbell-js/project-client');

async function updateWorkflow() {
  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  const runId = process.env.ZEALT_RUN_ID;
  const workflowKey = `test-workflow-${runId}`;
  
  const client = new Client({ token });
  try {
    const response = await client.workflows.saveWorkflow({
      key: workflowKey,
      steps: [],
      disabled: true
    });
    console.log("SDK Save Workflow response:", response.metadata.status);
  } catch (e) {
    console.error("SDK Error:", e);
  }
}

updateWorkflow();
