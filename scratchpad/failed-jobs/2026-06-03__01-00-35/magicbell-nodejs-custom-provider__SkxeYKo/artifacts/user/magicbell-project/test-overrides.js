const { Client } = require('magicbell-js/project-client');

const client = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN,
});

async function runTest(label, overrides) {
  const runId = process.env.ZEALT_RUN_ID;
  const emailLocal = process.env.MAGICBELL_EMAIL.split('@')[0];
  const recipientEmail = `${emailLocal}+${runId}@gmail.com`;

  try {
    const response = await client.broadcasts.createBroadcast({
      title: 'Test Broadcast ' + label,
      content: 'This is a test broadcast.',
      recipients: [
        {
          email: recipientEmail,
        },
      ],
      overrides: overrides,
    });
    console.log(`Success [${label}]:`, JSON.stringify(response.data.overrides, null, 2));
  } catch (err) {
    console.error(`Error [${label}]:`, err.message || err);
  }
}

async function main() {
  await runTest('skip-true', {
    providers: {
      sendgrid: { skip: true },
      mailgun: { skip: true },
      ses: { skip: true },
    },
  });

  await runTest('enabled-false', {
    providers: {
      sendgrid: { enabled: false },
      mailgun: { enabled: false },
      ses: { enabled: false },
    },
  });

  await runTest('disabled-true', {
    providers: {
      sendgrid: { disabled: true },
      mailgun: { disabled: true },
      ses: { disabled: true },
    },
  });
}

main();
