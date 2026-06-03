import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const magicbellEmail = process.env.MAGICBELL_EMAIL || '';
  const runId = process.env.ZEALT_RUN_ID || '';
  
  if (!magicbellEmail) {
    return res.status(500).json({ error: 'MAGICBELL_EMAIL environment variable is missing' });
  }

  const [localPart, domain] = magicbellEmail.split('@');
  const userEmail = runId ? `${localPart}+${runId}@${domain}` : magicbellEmail;

  try {
    const payload = {
      user_email: userEmail,
      api_key: process.env.MAGICBELL_API_KEY,
    };

    const token = jwt.sign(payload, process.env.MAGICBELL_SECRET_KEY, {
      expiresIn: '1y',
    });

    return res.status(200).json({
      token,
      userEmail,
      apiKey: process.env.MAGICBELL_API_KEY
    });
  } catch (error) {
    console.error('JWT generation error:', error);
    return res.status(500).json({ error: 'Failed to generate JWT' });
  }
}
