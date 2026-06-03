import { Client } from 'magicbell-js/project-client';

const runId = process.env.ZEALT_RUN_ID;

const client = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN,
});

const workflowKey = `conditional-workflow-${runId}`;

const workflow = {
  key: workflowKey,
  steps: [
    {
      command: 'broadcast',
      if: "user.custom_attributes.plan == 'premium'",
      input: {
        title: 'Premium User Notification',
        content: 'This notification is only for premium users.',
      },
    },
  ],
};

const response = await client.workflows.saveWorkflow(workflow);

console.log('Workflow created successfully:');
console.log(JSON.stringify(response.data, null, 2));