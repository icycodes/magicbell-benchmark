const { Client } = require('magicbell-js/project-client');

const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
const client = new Client({
  token: projectToken
});

async function listWorkflows() {
  const response = await client.workflows.fetchWorkflows();
  console.log('Workflows:', JSON.stringify(response.data, null, 2));
}

listWorkflows().catch(err => {
  console.error(err);
});
