const { Client } = require('magicbell-js/project-client');
const fs = require('fs');

async function main() {
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const zealtRunId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;

  if (!projectToken || !zealtRunId || !magicbellEmail) {
    console.error("Missing required environment variables");
    process.exit(1);
  }

  let targetEmail = `${magicbellEmail}+${zealtRunId}@gmail.com`;
  if (magicbellEmail.includes('@')) {
    const [user, domain] = magicbellEmail.split('@');
    targetEmail = `${user}+${zealtRunId}@${domain}`;
  }

  const client = new Client({
    token: projectToken,
  });

  try {
    const response = await client.broadcasts.createBroadcast({
      recipients: [
        { email: targetEmail }
      ],
      title: `Default Title ${zealtRunId}`,
      content: `Default Content ${zealtRunId}`,
      overrides: {
        channels: {
          email: {
            title: `Custom Email Title ${zealtRunId}`,
            content: `Custom Email Content ${zealtRunId}`,
          }
        }
      }
    });

    const output = `Broadcast ID: ${response.data.id}\n`;
    console.log(output.trim());
    fs.writeFileSync('/home/user/magicbell-nodejs-custom-template/output.log', output);
  } catch (error) {
    console.error("Error creating broadcast:", error);
    process.exit(1);
  }
}

main();
