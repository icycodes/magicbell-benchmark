const express = require('express');
const { Client } = require('magicbell-js/project-client');

const app = express();
app.use(express.json());

const magicbellClient = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN,
});

app.post('/webhook', async (req, res) => {
  const { type, data } = req.body;

  if (!type || !data || !data.object) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  if (type !== 'charge.succeeded') {
    return res.status(400).json({ error: 'Unsupported event type' });
  }

  const charge = data.object;
  const chargeId = charge.id;
  const amount = charge.amount;
  const receiptEmail = charge.receipt_email;

  if (!chargeId || amount === undefined || !receiptEmail) {
    return res.status(400).json({ error: 'Missing required fields in charge data' });
  }

  const amountInDollars = (amount / 100).toFixed(2);

  try {
    const response = await magicbellClient.broadcasts.createBroadcast({
      title: `Payment Succeeded - ${chargeId}`,
      content: `Thank you for your payment of $${amountInDollars}. Your charge ID is ${chargeId}.`,
      recipients: [
        { email: receiptEmail },
      ],
    });

    const broadcastId = response.data.id;
    return res.status(200).json({
      status: 'success',
      broadcast_id: broadcastId,
    });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});