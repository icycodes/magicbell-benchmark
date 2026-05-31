const express = require('express');
const { ProjectClient } = require('magicbell-js/project-client');

const app = express();
const port = 3000;

app.use(express.json());

const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

if (!projectToken) {
  console.error('MAGICBELL_PROJECT_TOKEN is required.');
  process.exit(1);
}

const magicbell = new ProjectClient({ token: projectToken });

app.post('/webhook', async (req, res) => {
  const event = req.body;

  if (!event || typeof event !== 'object') {
    return res.status(400).json({ error: 'Invalid payload.' });
  }

  if (event.type !== 'charge.succeeded') {
    return res.status(400).json({ error: 'Unsupported event type.' });
  }

  const charge = event.data?.object;
  const chargeId = charge?.id;
  const amountCents = charge?.amount;
  const receiptEmail = charge?.receipt_email;

  if (!chargeId || typeof amountCents !== 'number' || !receiptEmail) {
    return res.status(400).json({ error: 'Missing charge details.' });
  }

  const amountDollars = (amountCents / 100).toFixed(2);

  try {
    const response = await magicbell.broadcasts.create({
      title: `Payment Succeeded - ${chargeId}`,
      content: `Thank you for your payment of $${amountDollars}. Your charge ID is ${chargeId}.`,
      recipients: [{ email: receiptEmail }],
    });

    return res.status(200).json({
      status: 'success',
      broadcast_id: response?.id ?? null,
    });
  } catch (error) {
    console.error('MagicBell broadcast failed:', error);
    return res.status(500).json({ error: 'Failed to broadcast notification.' });
  }
});

app.listen(port, () => {
  console.log(`Stripe webhook server listening on port ${port}.`);
});
