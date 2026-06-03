import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Client } from 'magicbell-js/project-client';

const app = express();
app.use(cors());

const PORT = 3001;
const RUN_ID = process.env.ZEALT_RUN_ID || 'default';
const BASE_EMAIL = process.env.MAGICBELL_EMAIL || 'test@example.com';
const [localPart, ...domainParts] = BASE_EMAIL.split('@');
const domainPart = domainParts.join('@');
const userEmail = `${localPart}+react-inbox-${RUN_ID}@${domainPart}`;
const userExternalId = `react-inbox-${RUN_ID}`;

const apiKey = process.env.MAGICBELL_API_KEY;
const apiSecret = process.env.MAGICBELL_SECRET_KEY;
const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

const magicbell = new Client({ token: projectToken });

async function bootstrap() {
  try {
    console.log(`Bootstrapping user: ${userEmail}, external ID: ${userExternalId}`);
    // Upsert user
    const user = await magicbell.users.saveUser({
      user: {
        email: userEmail,
        external_id: userExternalId,
        first_name: 'Test',
        last_name: 'User'
      }
    });
    console.log('User upserted:', user.data.id);

    // Create a broadcast
    const broadcast = await magicbell.broadcasts.createBroadcast({
      title: 'Welcome to MagicBell React Inbox!',
      content: 'This is a seed notification from the backend.',
      recipients: [
        {
          email: userEmail
        }
      ]
    });
    console.log('Broadcast created:', broadcast.data.id);
  } catch (err) {
    console.error('Error during bootstrap:', err);
  }
}

app.get('/token', (req, res) => {
  const payload = {
    user_email: userEmail,
    user_external_id: userExternalId,
    api_key: apiKey
  };
  
  const token = jwt.sign(payload, apiSecret, { algorithm: 'HS256' });
  res.json({ token, userEmail, userExternalId, apiKey });
});

app.listen(PORT, async () => {
  console.log(`Backend listening on port ${PORT}`);
  await bootstrap();
});
