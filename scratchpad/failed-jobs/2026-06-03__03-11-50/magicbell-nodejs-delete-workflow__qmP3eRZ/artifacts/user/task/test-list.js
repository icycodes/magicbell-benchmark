const { Client } = require('magicbell-js/project-client');

async function listWorkflows() {
  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  const client = new Client({ token });
  try {
    const response = await client.workflows.fetchWorkflows();
    console.log("Workflows:", JSON.stringify(response.data, null, 2));
  } catch (e) {
    console.error("SDK Error:", e);
  }
}

listWorkflows();
