const fs = require("fs");
const path = require("path");
const { Client } = require("magicbell-js/project-client");

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  if (!runId) {
    throw new Error("ZEALT_RUN_ID is not set");
  }

  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  if (!projectToken) {
    throw new Error("MAGICBELL_PROJECT_TOKEN is not set");
  }

  const client = new Client({
    token: projectToken,
  });

  const workflowKey = `wf-save-${runId}`;

  const response = await client.workflows.saveWorkflow({
    key: workflowKey,
    steps: [
      {
        command: "broadcast",
        input: {
          title: `Workflow for run-id ${runId}`,
          content: "Hello from workflow run {{ run_id }}",
        },
      },
    ],
  });

  const savedKey = response.data?.key ?? workflowKey;
  const logLine = `Workflow Key: ${savedKey}`;
  const logPath = path.join(__dirname, "output.log");
  fs.writeFileSync(logPath, `${logLine}\n`, "utf8");

  console.log(logLine);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
