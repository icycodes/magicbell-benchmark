const { Client } = require('magicbell-js/project-client');
const fs = require('fs');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  if (!runId) {
    console.error("ZEALT_RUN_ID is not set");
    process.exit(1);
  }

  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  if (!token) {
    console.error("MAGICBELL_PROJECT_TOKEN is not set");
    process.exit(1);
  }

  const client = new Client({ token });
  
  const workflowKey = `wf-save-${runId}`;

  try {
    const response = await client.workflows.saveWorkflow({
      key: workflowKey,
      steps: [
        {
          command: "broadcast",
          input: {
            title: `Run ID: ${runId}`,
            content: "This is a test for {{ run_id }}"
          }
        }
      ]
    });

    const workflow = response.data;
    if (!workflow || !workflow.key) {
      throw new Error("Invalid response: missing workflow key");
    }

    fs.writeFileSync('/home/user/myproject/output.log', `Workflow Key: ${workflow.key}\n`);
    console.log(`Saved workflow ${workflow.key}`);
  } catch (error) {
    console.error("Failed to save workflow:", error);
    process.exit(1);
  }
}

main();