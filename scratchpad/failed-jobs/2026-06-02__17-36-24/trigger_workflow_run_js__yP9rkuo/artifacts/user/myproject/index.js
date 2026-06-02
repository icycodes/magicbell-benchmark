import { Client } from 'magicbell-js/project-client';
import { writeFileSync } from 'fs';

async function main() {
  // Step 1: Read environment variables
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !magicbellEmail || !projectToken) {
    throw new Error(
      'Missing required environment variables: ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_PROJECT_TOKEN'
    );
  }

  // Step 2: Initialize the Project Client
  const client = new Client({ token: projectToken });

  // Step 3: Compute the plus-addressed recipient email
  const [local, domain] = magicbellEmail.split('@');
  const recipientEmail = `${local}+trigger-js-${runId}@${domain}`;

  const externalId = `user-trigger-js-${runId}`;
  const workflowKey = `wf-trigger-js-${runId}`;
  const marker = `trigger-js-${runId}`;

  console.log(`Run ID:          ${runId}`);
  console.log(`Recipient email: ${recipientEmail}`);
  console.log(`External ID:     ${externalId}`);
  console.log(`Workflow key:    ${workflowKey}`);

  // Step 4: Upsert the MagicBell user
  console.log('\nUpserting user...');
  const userResponse = await client.users.saveUser({
    externalId,
    email: recipientEmail,
    firstName: 'Trigger',
    lastName: `Workflow-${runId}`,
  });
  console.log(`User saved: ${JSON.stringify(userResponse.data)}`);

  // Step 5: Save (upsert) the workflow definition
  console.log('\nSaving workflow...');
  const workflowResponse = await client.workflows.saveWorkflow({
    key: workflowKey,
    steps: [
      {
        command: 'broadcast',
        input: {
          title: `Trigger JS Run {{ marker }}`,
          recipients: [{ externalId }],
        },
      },
    ],
  });
  console.log(`Workflow saved: ${JSON.stringify(workflowResponse.data)}`);

  // Step 6: Trigger one workflow run
  console.log('\nCreating workflow run...');
  const runResponse = await client.workflows.createWorkflowRun({
    key: workflowKey,
    input: {
      recipient_external_id: externalId,
      marker,
    },
  });
  console.log(`Workflow run created: ${JSON.stringify(runResponse.data)}`);

  const workflowRunId = runResponse.data.id;
  console.log(`\nWorkflow Run ID: ${workflowRunId}`);

  // Step 7: Write the run ID to output.log
  const logContent = `Workflow Run ID: ${workflowRunId}`;
  writeFileSync('/home/user/myproject/output.log', logContent, 'utf8');
  console.log(`\nWritten to output.log: ${logContent}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
