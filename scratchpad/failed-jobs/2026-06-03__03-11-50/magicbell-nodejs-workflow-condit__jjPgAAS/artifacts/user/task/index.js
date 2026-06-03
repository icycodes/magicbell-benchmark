import { Client } from 'magicbell-js/project-client';

async function main() {
  const runId = process.env.ZEALT_RUN_ID || 'default-run-id';
  const workflowKey = `conditional-workflow-${runId}`;

  const client = new Client({
    token: process.env.MAGICBELL_PROJECT_TOKEN
  });

  try {
    const workflow = await client.workflows.saveWorkflow({
      key: workflowKey,
      steps: [
        {
          command: 'broadcast',
          if: "user.custom_attributes.plan == 'premium'",
          input: {
            title: "Premium Feature Available",
            content: "Check out the new premium features we just released."
          }
        }
      ]
    });

    console.log("Workflow created successfully:", workflow);
  } catch (error) {
    console.error("Error creating workflow:", error);
    process.exit(1);
  }
}

main();
