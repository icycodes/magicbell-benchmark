const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId) {
    console.error('Error: ZEALT_RUN_ID environment variable is required');
    process.exit(1);
  }

  if (!projectToken) {
    console.error('Error: MAGICBELL_PROJECT_TOKEN environment variable is required');
    process.exit(1);
  }

  const client = new Client({
    token: projectToken,
  });

  const workflowKey = `workflow-delay-${runId}`;

  const workflowDefinition = {
    key: workflowKey,
    steps: [
      {
        command: 'broadcast',
        input: {
          title: 'Welcome!',
        },
      },
      {
        command: 'wait',
        input: {
          duration: 60,
        },
      },
      {
        command: 'broadcast',
        input: {
          title: 'Follow up',
        },
      },
    ],
  };

  try {
    const response = await client.workflows.saveWorkflow(workflowDefinition);
    console.log(`Workflow "${workflowKey}" created successfully!`);
  } catch (error) {
    console.error('Error creating workflow:', error.message || error);
    process.exit(1);
  }
}

main();