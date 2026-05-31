const { Client } = require('magicbell-js/project-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const gmailUserName = process.env.GMAIL_USER_NAME;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !gmailUserName || !projectToken) {
    console.error('Missing required environment variables: ZEALT_RUN_ID, GMAIL_USER_NAME, MAGICBELL_PROJECT_TOKEN');
    process.exit(1);
  }

  const workflowKey = `onboarding-workflow-${runId}`;
  const userEmail = `${gmailUserName}+${runId}@gmail.com`;

  // Initialize the MagicBell project client
  const client = new Client({ token: projectToken });

  // Save the workflow definition
  const workflowDef = await client.workflows.saveWorkflow({
    key: workflowKey,
    steps: [
      {
        command: 'broadcast',
        input: {
          title: 'Welcome to MagicBell, {{input.run_id}}!',
          content: 'This is a test notification for run {{input.run_id}}.',
          recipients: [{ email: '{{input.user_email}}' }],
        },
      },
    ],
  });

  console.log('Workflow definition saved:', JSON.stringify(workflowDef.data, null, 2));

  // Trigger a workflow run
  const runResponse = await client.workflows.createWorkflowRun({
    key: workflowKey,
    input: {
      run_id: runId,
      user_email: userEmail,
    },
  });

  console.log('Workflow run triggered:', JSON.stringify(runResponse.data, null, 2));

  const workflowRunId = runResponse.data.id;

  // Write the workflow run ID to the log file
  const logPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(logPath, `Workflow Run ID: ${workflowRunId}\n`);
  console.log(`Log written to ${logPath}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});