const fs = require('fs');
const path = require('path');
const { Client } = require('magicbell-js/project-client');

async function main() {
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const runId = process.env.ZEALT_RUN_ID;
  const gmailUserName = process.env.GMAIL_USER_NAME;

  if (!projectToken) {
    throw new Error('MAGICBELL_PROJECT_TOKEN is required');
  }
  if (!runId) {
    throw new Error('ZEALT_RUN_ID is required');
  }
  if (!gmailUserName) {
    throw new Error('GMAIL_USER_NAME is required');
  }

  const workflowKey = `onboarding-workflow-${runId}`;
  const userEmail = `${gmailUserName}+${runId}@gmail.com`;

  const client = new Client({ projectToken });

  const workflowDefinition = {
    key: workflowKey,
    name: `Onboarding Workflow ${runId}`,
    steps: [
      {
        key: 'broadcast-step',
        command: 'broadcast',
        inputs: {
          title: 'Welcome to MagicBell, {{input.run_id}}!',
          content: 'This is a test notification for run {{input.run_id}}.',
          recipients: [
            {
              email: '{{input.user_email}}'
            }
          ]
        }
      }
    ]
  };

  await client.workflows.saveWorkflow(workflowDefinition);

  const workflowRun = await client.workflows.createWorkflowRun(workflowKey, {
    inputs: {
      run_id: runId,
      user_email: userEmail
    }
  });

  const logPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(logPath, `Workflow Run ID: ${workflowRun.id}\n`, 'utf8');
  console.log(`Workflow Run ID: ${workflowRun.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
