import { Client } from 'magicbell-js/project-client';
import fs from 'fs';
import path from 'path';

async function run() {
  const runId = process.env.ZEALT_RUN_ID;
  if (!runId) {
    console.error('Error: ZEALT_RUN_ID environment variable is not set.');
    process.exit(1);
  }

  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  if (!projectToken) {
    console.error('Error: MAGICBELL_PROJECT_TOKEN environment variable is not set.');
    process.exit(1);
  }

  const workflowKey = `wf-save-${runId}`;
  console.log(`Workflow Key: ${workflowKey}`);

  const client = new Client({
    token: projectToken,
  });

  const body = {
    key: workflowKey,
    steps: [
      {
        command: 'broadcast',
        input: {
          title: `Workflow run for run-id ${runId}`,
          content: `This is a test notification for run_id: {{ run_id }}`,
        },
      },
    ],
  };

  try {
    console.log('Saving workflow with body:', JSON.stringify(body, null, 2));
    const response = await client.workflows.saveWorkflow(body);
    
    // The response has a data field containing the saved workflow's key, or response.data.key.
    // Let's inspect the structure of the response.
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    const savedKey = response.data?.key || workflowKey;

    const logFilePath = '/home/user/myproject/output.log';
    fs.writeFileSync(logFilePath, `Workflow Key: ${savedKey}\n`);
    console.log(`Saved log to ${logFilePath}`);
  } catch (error) {
    console.error('Error saving workflow:', error);
    process.exit(1);
  }
}

run();
