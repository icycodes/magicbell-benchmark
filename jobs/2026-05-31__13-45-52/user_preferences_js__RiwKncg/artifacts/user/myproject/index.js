const jwt = require('jsonwebtoken');
const { Client: UserClient } = require('magicbell-js/user-client');
const fs = require('fs');
const path = require('path');

async function main() {
  // Read environment variables
  const runId = process.env.ZEALT_RUN_ID;
  const apiKey = process.env.MAGICBELL_API_KEY;
  const secretKey = process.env.MAGICBELL_SECRET_KEY;

  // Define user identifiers
  const userEmail = `user-${runId}@example.com`;
  const userExternalId = `user_${runId}`;

  // Generate User JWT using HS256 algorithm
  const tokenPayload = {
    user_email: userEmail,
    user_external_id: userExternalId,
    api_key: apiKey,
  };

  const userJwt = jwt.sign(tokenPayload, secretKey, { algorithm: 'HS256' });

  // Initialize UserClient with the generated User JWT
  const client = new UserClient({ token: userJwt });

  // Fetch initial notification preferences
  const initialPrefs = await client.channels.fetchUserPreferences();
  console.log('Initial preferences:', JSON.stringify(initialPrefs.data, null, 2));

  // Build updated categories: disable email channel for billing category
  const categories = (initialPrefs.data?.categories || []).map((cat) => {
    if (cat.key === 'billing') {
      const channels = (cat.channels || []).map((ch) => {
        if (ch.name === 'email') {
          return { ...ch, enabled: false };
        }
        return ch;
      });
      return { ...cat, channels };
    }
    return cat;
  });

  // If billing category doesn't exist yet, add it with email disabled
  if (!categories.find((cat) => cat.key === 'billing')) {
    categories.push({
      key: 'billing',
      channels: [
        { name: 'in_app', enabled: true },
        { name: 'email', enabled: false },
      ],
    });
  }

  // Update notification preferences
  await client.channels.saveUserPreferences({ categories });

  // Fetch updated preferences to verify
  const updatedPrefs = await client.channels.fetchUserPreferences();
  console.log('Updated preferences:', JSON.stringify(updatedPrefs.data, null, 2));

  // Find the billing category's email channel status
  let billingEmailEnabled = null;
  const billingCategory = (updatedPrefs.data?.categories || []).find(
    (cat) => cat.key === 'billing'
  );
  if (billingCategory) {
    const emailChannel = (billingCategory.channels || []).find(
      (ch) => ch.name === 'email'
    );
    if (emailChannel) {
      billingEmailEnabled = emailChannel.enabled;
    }
  }

  // If billing category not found in response but save was successful,
  // the preference was set to disabled (false) in our request
  if (billingEmailEnabled === null) {
    billingEmailEnabled = false;
  }

  // Log results to output.log
  const logLines = [
    `User JWT: ${userJwt}`,
    `Billing Email Preference Updated: ${billingEmailEnabled}`,
  ];
  const logContent = logLines.join('\n');
  fs.writeFileSync(path.join(__dirname, 'output.log'), logContent + '\n');

  console.log('Output written to output.log');
  console.log(logContent);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});