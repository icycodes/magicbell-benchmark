const { Client } = require('magicbell-js/project-client');
const fs = require('fs');

async function main() {
  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  const runId = process.env.ZEALT_RUN_ID;
  const userName = process.env.GMAIL_USER_NAME;

  if (!token || !runId || !userName) {
    console.error("Missing environment variables");
    process.exit(1);
  }

  // Initialize the project client using the token
  const client = new Client({ token });

  const workflowKey = `onboarding-workflow-${runId}`;
  const userEmail = `${userName}+${runId}@gmail.com`;

  try {
    // Save the workflow definition
    const workflowDef = {
      key: workflowKey,
      steps: [
        {
          command: 'broadcast',
          input: {
            title: "Welcome to MagicBell, {{input.run_id}}!",
            content: "This is a test notification for run {{input.run_id}}.",
            recipients: [
              { email: "{{input.user_email}}" }
            ]
          }
        }
      ]
    };

    console.log(`Saving workflow: ${workflowKey}`);
    await client.workflows.saveWorkflow(workflowDef);

    // Trigger the workflow run
    const runRequest = {
      key: workflowKey,
      input: {
        run_id: runId,
        user_email: userEmail
      }
    };

    console.log(`Triggering workflow run for: ${workflowKey}`);
    const response = await client.workflows.createWorkflowRun(runRequest);
    
    // The response is an HttpResponse, so the data is in response.data
    const runIdResult = response.data.id;
    console.log(`Workflow Run ID: ${runIdResult}`);

    // Write to log file
    fs.writeFileSync('/home/user/myproject/output.log', `Workflow Run ID: ${runIdResult}\n`);
    console.log('Successfully wrote to output.log');

  } catch (error) {
    console.error("Error executing workflow:");
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
