const runId = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

const email = `${magicbellEmail.split('@')[0]}+${runId}@gmail.com`;

async function main() {
  console.log(`Sending a broadcast to create user: ${email}`);
  try {
    const response = await fetch('https://api.magicbell.com/broadcasts', {
      method: 'POST',
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-API-SECRET': secretKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        broadcast: {
          title: 'Initialization broadcast',
          content: 'This broadcast creates the user in MagicBell.',
          recipients: [{ email }]
        }
      })
    });
    console.log('Broadcast response status:', response.status);
    const data = await response.json();
    console.log('Broadcast response data:', data);
  } catch (err) {
    console.error('Broadcast failed:', err.message);
  }
}

main();
