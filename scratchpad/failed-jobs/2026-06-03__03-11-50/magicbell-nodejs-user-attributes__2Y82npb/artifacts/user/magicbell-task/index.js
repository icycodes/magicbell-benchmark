const fs = require('fs');
const { Client: ProjectClient } = require('magicbell-js/project-client');

async function main() {
  const runId = process.env.ZEALT_RUN_ID;
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const baseEmail = process.env.MAGICBELL_EMAIL;
  
  if (!runId || !projectToken || !baseEmail) {
    console.error('Missing required environment variables');
    process.exit(1);
  }
  
  const [localPart, domain] = baseEmail.split('@');
  const email = `${localPart}+${runId}@${domain}`;
  const externalId = `user-${runId}`;
  
  const client = new ProjectClient({
    token: projectToken,
  });

  try {
    const response = await client.users.saveUser({
      email: email,
      externalId: externalId,
      customAttributes: {
        plan: "premium",
        task: `user-attributes-${runId}`
      }
    });

    const user = response.data;
    if (!user || !user.id) {
      console.error('Failed to get user ID from response:', response);
      process.exit(1);
    }
    
    fs.writeFileSync('/home/user/magicbell-task/output.log', `User ID: ${user.id}\n`);
    console.log(`Successfully saved user with ID: ${user.id}`);
  } catch (error) {
    console.error('Error saving user:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

main();
