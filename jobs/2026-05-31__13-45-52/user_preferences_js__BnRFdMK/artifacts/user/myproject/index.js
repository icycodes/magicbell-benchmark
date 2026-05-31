const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

const runId = process.env.ZEALT_RUN_ID;
const secretKey = process.env.MAGICBELL_SECRET_KEY;
const apiKey = process.env.MAGICBELL_API_KEY;

if (!runId) {
  throw new Error('ZEALT_RUN_ID environment variable is required.');
}

if (!secretKey) {
  throw new Error('MAGICBELL_SECRET_KEY environment variable is required.');
}

if (!apiKey) {
  throw new Error('MAGICBELL_API_KEY environment variable is required.');
}

const userEmail = `user-${runId}@example.com`;
const userExternalId = `user_${runId}`;

const userJwt = jwt.sign(
  {
    user_email: userEmail,
    user_external_id: userExternalId,
    api_key: apiKey,
  },
  secretKey,
  { algorithm: 'HS256' }
);

const client = new Client({ token: userJwt });

const notificationPreferences = {
  get: () => client.channels.fetchUserPreferences(),
  update: (preferences) => client.channels.saveUserPreferences(preferences),
};

const getBillingEmailStatus = (preferences) => {
  const billingCategory = preferences?.categories?.find(
    (category) => category.key === 'billing'
  );

  const billingEmailChannel = billingCategory?.channels?.find(
    (channel) => channel.name === 'email'
  );

  return billingEmailChannel?.enabled;
};

const disableBillingEmail = (preferences) => {
  const categories = Array.isArray(preferences?.categories)
    ? [...preferences.categories]
    : [];

  let billingCategory = categories.find((category) => category.key === 'billing');

  if (!billingCategory) {
    billingCategory = { key: 'billing', channels: [] };
    categories.push(billingCategory);
  }

  const channels = Array.isArray(billingCategory.channels)
    ? [...billingCategory.channels]
    : [];

  let emailChannel = channels.find((channel) => channel.name === 'email');

  if (!emailChannel) {
    emailChannel = { name: 'email', enabled: false };
    channels.push(emailChannel);
  } else {
    emailChannel.enabled = false;
  }

  billingCategory.channels = channels;

  return {
    ...preferences,
    categories,
  };
};

const main = async () => {
  const { data: initialPreferences } = await notificationPreferences.get();
  const updatedPreferences = disableBillingEmail(initialPreferences || {});

  await notificationPreferences.update(updatedPreferences);

  const { data: verifiedPreferences } = await notificationPreferences.get();
  const billingEmailStatus =
    getBillingEmailStatus(verifiedPreferences || {}) ?? false;

  const logLines = [
    `User JWT: ${userJwt}`,
    `Billing Email Preference Updated: ${billingEmailStatus}`,
  ];

  await fs.writeFile('/home/user/myproject/output.log', logLines.join('\n'));
};

main().catch(async (error) => {
  await fs.writeFile(
    '/home/user/myproject/output.log',
    `User JWT: ${userJwt}\nBilling Email Preference Updated: false\nError: ${error.message}`
  );
  process.exit(1);
});
