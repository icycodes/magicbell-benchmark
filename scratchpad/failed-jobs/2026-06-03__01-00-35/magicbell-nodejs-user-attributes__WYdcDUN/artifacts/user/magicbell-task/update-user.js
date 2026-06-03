const fs = require('fs');
const path = require('path');
const { Client: ProjectClient } = require('magicbell-js/project-client');

async function main() {
  const token = process.env.MAGICBELL_PROJECT_TOKEN;
  const email = process.env.MAGICBELL_EMAIL;
  const runId = process.env.ZEALT_RUN_ID;

  if (!token) {
    console.error('Error: MAGICBELL_PROJECT_TOKEN is not set');
    process.exit(1);
  }
  if (!email) {
    console.error('Error: MAGICBELL_EMAIL is not set');
    process.exit(1);
  }
  if (!runId) {
    console.error('Error: ZEALT_RUN_ID is not set');
    process.exit(1);
  }

  // Parse email and insert +${run-id}
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) {
    console.error('Error: Invalid MAGICBELL_EMAIL format');
    process.exit(1);
  }
  const localPart = email.substring(0, atIndex);
  const domainPart = email.substring(atIndex + 1);
  const modifiedEmail = `${localPart}+${runId}@${domainPart}`;

  console.log(`Using email: ${modifiedEmail}`);
  console.log(`Using externalId: user-${runId}`);

  // Initialize ProjectClient
  const client = new ProjectClient({
    token: token,
  });

  try {
    const response = await client.users.saveUser({
      email: modifiedEmail,
      externalId: `user-${runId}`,
      customAttributes: {
        plan: 'premium',
        task: `user-attributes-${runId}`,
      },
    });

    const user = response.data;
    if (!user || !user.id) {
      throw new Error('User object or User ID is missing in the response');
    }

    const userId = user.id;
    console.log(`Successfully updated user. User ID: ${userId}`);

    // Output to log file
    const logPath = '/home/user/magicbell-task/output.log';
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, `User ID: ${userId}\n`);
    console.log(`Saved user ID to ${logPath}`);

  } catch (error) {
    console.error('Error updating user:', error);
    if (error.metadata) {
      console.error('HTTP Status:', error.metadata.status);
      console.error('HTTP Status Text:', error.metadata.statusText);
    }
    if (error.raw) {
      try {
        const text = Buffer.from(error.raw).toString('utf8');
        console.error('Raw response:', text);
      } catch (e) {
        console.error('Failed to decode raw response:', e);
      }
    }
    process.exit(1);
  }
}

main();
