import { Client } from 'magicbell-js/project-client';

const runId = process.env.ZEALT_RUN_ID;
const token = process.env.MAGICBELL_PROJECT_TOKEN;

if (!runId) {
  throw new Error('ZEALT_RUN_ID environment variable is not set');
}

if (!token) {
  throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is not set');
}

const client = new Client({ token });

const workflowKey = `conditional-workflow-${runId}`;

const workflow = {
  key: workflowKey,
  steps: [
    {
      command: 'broadcast',
      if: "user.custom_attributes.plan == 'premium'",
      input: {
        title: 'Premium Notification',
        content: 'This notification is exclusively for premium users.',
      },
    },
  ],
};

const response = await client.workflows.saveWorkflow(workflow);

console.log('Workflow created successfully:');
console.log(JSON.stringify(response.data, null, 2));
