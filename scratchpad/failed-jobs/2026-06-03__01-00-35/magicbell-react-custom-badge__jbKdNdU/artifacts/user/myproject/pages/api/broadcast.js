import { Client } from 'magicbell-js/project-client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(451).json({ error: 'Method not allowed' });
  }

  const magicbellEmail = process.env.MAGICBELL_EMAIL || '';
  const runId = process.env.ZEALT_RUN_ID || '';
  
  if (!magicbellEmail) {
    return res.status(500).json({ error: 'MAGICBELL_EMAIL environment variable is missing' });
  }

  const [localPart, domain] = magicbellEmail.split('@');
  const userEmail = runId ? `${localPart}+${runId}@${domain}` : magicbellEmail;

  try {
    const client = new Client({
      token: process.env.MAGICBELL_PROJECT_TOKEN,
    });

    const response = await client.broadcasts.createBroadcast({
      title: 'New Notification!',
      content: 'This notification was triggered via POST /api/broadcast.',
      recipients: [
        {
          email: userEmail,
        },
      ],
    });

    return res.status(200).json({ success: true, userEmail, data: response.data });
  } catch (error) {
    console.error('Broadcast error:', error);
    return res.status(500).json({ error: error.message || 'Failed to trigger broadcast' });
  }
}
