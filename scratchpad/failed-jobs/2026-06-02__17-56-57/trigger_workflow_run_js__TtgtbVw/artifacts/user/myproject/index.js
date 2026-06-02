const fs = require('fs');
const path = require('path');
const { Client } = require('magicbell-js/project-client');

const requiredEnvVars = [
  'ZEALT_RUN_ID',
  'MAGICBELL_EMAIL',
  'MAGICBELL_PROJECT_TOKEN',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const runId = process.env.ZEALT_RUN_ID;
const [emailLocal, emailDomain] = process.env.MAGICBELL_EMAIL.split('@');

if (!emailLocal || !emailDomain) {
  throw new Error('MAGICBELL_EMAIL must be a valid email address.');
}

const recipientEmail = `${emailLocal}+trigger-js-${runId}@${emailDomain}`;
const userExternalId = `user-trigger-js-${runId}`;
const workflowKey = `wf-trigger-js-${runId}`;

const client = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN,
});

async function run() {
  await client.users.saveUser({
    externalId: userExternalId,
    email: recipientEmail,
    firstName: 'Trigger',
    lastName: `Workflow-${runId}`,
  });

  await client.workflows.saveWorkflow({
    key: workflowKey,
    steps: [
      {
        command: 'broadcast',
        input: {
          title: 'Trigger JS Run {{ marker }}',
          recipients: [
            {
              externalId: userExternalId,
            },
          ],
        },
      },
    ],
  });

  const runResponse = await client.workflows.createWorkflowRun({
    key: workflowKey,
    input: {
      recipient_external_id: userExternalId,
      marker: `trigger-js-${runId}`,
    },
  });

  const workflowRunId = runResponse.data.id;
  const outputPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(outputPath, `Workflow Run ID: ${workflowRunId}\n`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
