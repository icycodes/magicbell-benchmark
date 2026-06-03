export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const runId = process.env.ZEALT_RUN_ID || 'default-run';
  const rawEmail = process.env.MAGICBELL_EMAIL || 'test@example.com';
  
  let userEmail = rawEmail;
  if (rawEmail.includes('@')) {
    const [local, domain] = rawEmail.split('@');
    userEmail = `${local}+${runId}@${domain}`;
  } else {
    userEmail = `${rawEmail}+${runId}`;
  }

  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Missing MagicBell credentials' });
  }

  try {
    const response = await fetch('https://api.magicbell.com/broadcasts', {
      method: 'POST',
      headers: {
        'X-MAGICBELL-API-KEY': apiKey,
        'X-MAGICBELL-API-SECRET': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        broadcast: {
          title: 'Test Broadcast Notification',
          text: 'This is a test notification to verify the unread badge count.',
          recipients: [{ email: userEmail }],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MagicBell API Error:', errorText);
      return res.status(response.status).json({ error: 'Failed to broadcast', details: errorText });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Broadcast error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
