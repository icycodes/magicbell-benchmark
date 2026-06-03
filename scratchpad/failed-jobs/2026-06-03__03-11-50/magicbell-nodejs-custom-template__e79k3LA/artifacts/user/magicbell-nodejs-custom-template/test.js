const { Client } = require('magicbell-js/project-client');

async function main() {
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  const zealtRunId = process.env.ZEALT_RUN_ID;
  const magicbellEmail = process.env.MAGICBELL_EMAIL;

  const client = new Client({
    token: projectToken,
  });

  try {
    const broadcast = await client.broadcasts.createBroadcast({
      recipients: [
        { email: `${magicbellEmail}+${zealtRunId}@gmail.com` }
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

    console.log(JSON.stringify(broadcast, null, 2));
  } catch (error) {
    console.error("Error creating broadcast:", error);
  }
}

main();
