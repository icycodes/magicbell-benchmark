import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const runId = process.env.ZEALT_RUN_ID || 'default-run';
  const rawEmail = process.env.MAGICBELL_EMAIL || 'test@example.com';
  
  let userEmail = rawEmail;
  if (rawEmail.includes('@')) {
    const [local, domain] = rawEmail.split('@');
    userEmail = `${local}+${runId}@${domain}`;
  } else {
    userEmail = `${rawEmail}+${runId}`;
  }

  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Missing MAGICBELL_SECRET_KEY' });
  }

  // Generate User JWT
  const userJwt = jwt.sign({ user_email: userEmail }, secretKey, {
    expiresIn: '1h',
  });

  res.status(200).json({
    userEmail,
    userJwt,
    apiKey: process.env.MAGICBELL_API_KEY,
  });
}
