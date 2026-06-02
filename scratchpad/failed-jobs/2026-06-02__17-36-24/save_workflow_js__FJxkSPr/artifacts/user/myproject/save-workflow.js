const { Client } = require('magicbell-js/project-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  if (!runId) {
    throw new Error('ZEALT_RUN_ID environment variable is not set');
  }

  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  if (!token) {
    throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not set');
  }

  const workflowKey = `wf-save-${runId}`;

  const client = new Client({ token });

  const workflowDefinition = {
    key: workflowKey,
    steps: [
      {
        command: 'broadcast',
        input: {
          title: `Workflow run ${runId}`,
          content: `This workflow was triggered for run-id: {{ run_id }}`,
        },
      },
    ],
  };

  console.log(`Saving workflow with key: ${workflowKey}`);

  const response = await client.workflows.saveWorkflow(workflowDefinition);

  const savedKey = response.data.key;
  console.log(`Workflow saved successfully. Key: ${savedKey}`);

  const logPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(logPath, `Workflow Key: ${savedKey}\n`);
  console.log(`Log written to ${logPath}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
