const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  if (!runId) {
    console.error('Error: ZEALT_RUN_ID environment variable is not set.');
    process.exit(1);
  }

  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  if (!token) {
    console.error('Error: MAGICBELL_PROJECT_TOKEN environment variable is not set.');
    process.exit(1);
  }

  const client = new Client({ token });

  const workflowKey = `workflow-delay-${runId}`;

  const workflow = {
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

  const response = await client.workflows.saveWorkflow(workflow);
  console.log(`Workflow '${workflowKey}' created successfully.`);
}

main().catch((err) => {
  console.error('Failed to create workflow:', err);
  process.exit(1);
});
