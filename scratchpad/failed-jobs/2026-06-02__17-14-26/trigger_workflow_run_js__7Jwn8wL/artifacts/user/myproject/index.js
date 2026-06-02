const fs = require('fs');
const { Client } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const email = process.env.MAGICBELL_EMAIL;
  const token = process.env.MAGICBELL_PROJECT_TOKEN;

  if (!runId || !email || !token) {
    console.error("Missing environment variables");
    process.exit(1);
  }

  const client = new Client({ token });

  const [local, domain] = email.split('@');
  const plusEmail = `${local}+trigger-js-${runId}@${domain}`;
  const externalId = `user-trigger-js-${runId}`;

  console.log("Saving user...");
  await client.users.saveUser({
    externalId: externalId,
    email: plusEmail,
    firstName: 'Trigger',
    lastName: `Workflow-${runId}`
  });

  const workflowKey = `wf-trigger-js-${runId}`;

  console.log("Saving workflow...");
  await client.workflows.saveWorkflow({
    key: workflowKey,
    steps: [
      {
        command: 'broadcast',
        input: {
          title: 'Trigger JS Run {{ marker }}',
          recipients: [{ external_id: externalId }]
        }
      }
    ]
  });

  console.log("Triggering workflow run...");
  const runResponse = await client.workflows.createWorkflowRun({
    key: workflowKey,
    input: {
      recipient_external_id: externalId,
      marker: `trigger-js-${runId}`
    }
  });

  const runIdResult = runResponse.data.id;
  console.log("Run ID:", runIdResult);

  fs.writeFileSync('/home/user/myproject/output.log', `Workflow Run ID: ${runIdResult}\n`);
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
