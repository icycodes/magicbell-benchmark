const runId = process.env.ZEALT_RUN_ID;
const workflowKey = `test-workflow-${runId}`;

async function testHeaders() {
  const urls = [
    `https://api.magicbell.com/v2/workflows/${workflowKey}`,
    `https://api.magicbell.com/workflows/${workflowKey}`
  ];

  for (const url of urls) {
    console.log(`\n--- Testing with X-MAGICBELL headers on ${url} ---`);
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-MAGICBELL-API-KEY': process.env.MAGICBELL_API_KEY,
          'X-MAGICBELL-API-SECRET': process.env.MAGICBELL_SECRET_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log(`Status: ${response.status}`);
      console.log('Headers:');
      for (const [key, value] of response.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      const text = await response.text();
      console.log(`Body: ${text}`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
}

testHeaders();
