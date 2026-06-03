const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const token = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !token) {
    console.error("Missing ZEALT_RUN_ID or MAGICBELL_PROJECT_TOKEN environment variables");
    process.exit(1);
  }

  const client = new Client({
    token: token
  });

  const workflowDefinition = {
    key: `workflow-delay-${runId}`,
    steps: [
      {
        command: 'broadcast',
        input: {
          title: 'Welcome!'
        }
      },
      {
        command: 'wait',
        input: {
          duration: 60
        }
      },
      {
        command: 'broadcast',
        input: {
          title: 'Follow up'
        }
      }
    ]
  };

  try {
    const response = await client.workflows.saveWorkflow(workflowDefinition);
    console.log("Workflow created successfully:", response.data?.key || workflowDefinition.key);
  } catch (error) {
    console.error("Failed to create workflow:", error);
    process.exit(1);
  }
}

main();
