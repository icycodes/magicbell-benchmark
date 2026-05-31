const express = require('express');
const { Client } = require('magicbell-js/project-client');

const app = express();
app.use(express.json());

const magicbell = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN,
});

app.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (!type || !data || !data.object) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    if (type === 'charge.succeeded') {
      const { id, amount, receipt_email } = data.object;
      
      if (!id || amount === undefined || !receipt_email) {
        return res.status(400).json({ error: 'Missing required charge data' });
      }

      const dollars = (amount / 100).toFixed(2);

      const response = await magicbell.broadcasts.createBroadcast({
        title: `Payment Succeeded - ${id}`,
        content: `Thank you for your payment of $${dollars}. Your charge ID is ${id}.`,
        recipients: [{ email: receipt_email }]
      });

      return res.status(200).json({
        status: 'success',
        broadcast_id: response.data?.id
      });
    }

    return res.status(400).json({ error: 'Unsupported event type' });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
