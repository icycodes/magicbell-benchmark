const { Client } = require('magicbell-js/project-client');

const client = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN,
});

async function test() {
  const runId = process.env.ZEALT_RUN_ID;
  const emailLocal = process.env.MAGICBELL_EMAIL.split('@')[0];
  const recipientEmail = `${emailLocal}+${runId}@gmail.com`;

  console.log('Recipient Email:', recipientEmail);

  try {
    const response = await client.broadcasts.createBroadcast({
      title: 'Test Broadcast',
      content: 'This is a test broadcast.',
      recipients: [
        {
          email: recipientEmail,
        },
      ],
      overrides: {
        channels: {
          email: {
            title: 'Overridden Title',
          },
        },
      },
    });
    console.log('Success:', response.data);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
