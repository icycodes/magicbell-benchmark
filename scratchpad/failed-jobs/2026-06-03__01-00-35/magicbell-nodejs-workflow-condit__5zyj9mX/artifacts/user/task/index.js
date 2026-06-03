import { Client } from 'magicbell-js/project-client';

const runId = process.env.ZEALT_RUN_ID;
if (!runId) {
  console.error("ZEALT_RUN_ID environment variable is not defined.");
  process.exit(1);
}

const token = process.env.MAGICBELL_PROJECT_TOKEN;
if (!token) {
  console.error("MAGICBELL_PROJECT_TOKEN environment variable is not defined.");
  process.exit(1);
}

const client = new Client({ token });

const workflowKey = `conditional-workflow-${runId}`;

console.log(`Creating workflow with key: ${workflowKey}`);

const workflowDefinition = {
  key: workflowKey,
  steps: [
    {
      command: 'broadcast',
      if: "user.custom_attributes.plan == 'premium'",
      input: {
        title: 'Welcome Premium Member!',
        content: 'Thank you for being a premium subscriber.'
      }
    }
  ]
};

try {
  const response = await client.workflows.saveWorkflow(workflowDefinition);
  console.log("Workflow successfully created/updated:");
  console.log(JSON.stringify(response.data, null, 2));
} catch (error) {
  console.error("Error creating workflow:", error);
  process.exit(1);
}
