import { Client } from 'magicbell-js/project-client';
import fs from 'fs';

async function run() {
  const runId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;
  const magicbellProjectToken = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId) {
    throw new Error('ZEALT_RUN_ID environment variable is required');
  }
  if (!magicbellEmail) {
    throw new Error('MAGICBELL_EMAIL environment variable is required');
  }
  if (!magicbellProjectToken) {
    throw new Error('MAGICBELL_PROJECT_TOKEN environment variable is required');
  }

  console.log(`Using ZEALT_RUN_ID: ${runId}`);
  console.log(`Using MAGICBELL_EMAIL: ${magicbellEmail}`);

  // 1. Initialize Project Client
  const client = new Client({
    token: magicbellProjectToken,
  });

  // 2. Compute recipient email
  const [local, domain] = magicbellEmail.split('@');
  if (!local || !domain) {
    throw new Error(`Invalid MAGICBELL_EMAIL format: ${magicbellEmail}`);
  }
  const recipientEmail = `${local}+trigger-js-${runId}@${domain}`;
  console.log(`Computed recipient email: ${recipientEmail}`);

  // 3. Upsert MagicBell user
  const userExternalId = `user-trigger-js-${runId}`;
  console.log(`Upserting user with externalId: ${userExternalId}`);
  const userResponse = await client.users.saveUser({
    externalId: userExternalId,
    email: recipientEmail,
    firstName: 'Trigger',
    lastName: `Workflow-${runId}`,
  });
  console.log('User upserted successfully:', userResponse.data);

  // 4. Save workflow
  const workflowKey = `wf-trigger-js-${runId}`;
  console.log(`Saving workflow with key: ${workflowKey}`);
  const workflowResponse = await client.workflows.saveWorkflow({
    key: workflowKey,
    steps: [
      {
        command: 'broadcast',
        input: {
          title: `Trigger JS Run {{ marker }}`,
          recipients: [
            {
              external_id: '{{ recipient_external_id }}',
              externalId: '{{ recipient_external_id }}'
            }
          ]
        }
      }
    ]
  });
  console.log('Workflow saved successfully:', workflowResponse.data);

  // 5. Create workflow run
  console.log(`Creating workflow run for key: ${workflowKey}`);
  const runResponse = await client.workflows.createWorkflowRun({
    key: workflowKey,
    input: {
      recipient_external_id: userExternalId,
      marker: `trigger-js-${runId}`
    }
  });

  const createdRunId = runResponse.data?.id;
  if (!createdRunId) {
    throw new Error('Failed to retrieve workflow run ID from response');
  }
  console.log(`Workflow run created with ID: ${createdRunId}`);

  // 6. Write to output.log
  const logPath = '/home/user/myproject/output.log';
  const logContent = `Workflow Run ID: ${createdRunId}\n`;
  fs.writeFileSync(logPath, logContent, 'utf8');
  console.log(`Successfully wrote workflow run ID to ${logPath}`);
}

run().catch((error) => {
  console.error('Execution failed:', error);
  process.exit(1);
});
