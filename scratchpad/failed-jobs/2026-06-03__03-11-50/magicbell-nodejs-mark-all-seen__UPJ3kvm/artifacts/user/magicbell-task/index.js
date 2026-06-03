const jwt = require('jsonwebtoken');
const { Client } = require('magicbell-js/user-client');

async function main() {
  try {
    const email = `${process.env.MAGICBELL_EMAIL}+${process.env.ZEALT_RUN_ID}@gmail.com`;
    
    // Generate JWT
    const token = jwt.sign(
      { user_email: email, api_key: process.env.MAGICBELL_API_KEY },
      process.env.MAGICBELL_SECRET_KEY,
      { algorithm: 'HS256' }
    );

    // Initialize client
    const client = new Client({ token });

    if (client.notifications && client.notifications.markAllNotificationsSeen) {
      await client.notifications.markAllNotificationsSeen();
    } else if (client.core && client.core.fetch) {
      await client.core.fetch('/notifications/seen', { method: 'POST' });
    } else {
      // Fallback: If core.fetch is not available, use standard fetch
      const baseUrl = client.config?.baseUrl || 'https://api.magicbell.com';
      const response = await fetch(`${baseUrl}/notifications/seen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-MAGICBELL-API-KEY': process.env.MAGICBELL_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark notifications as seen: ${response.statusText}`);
      }
    }
    
    console.log('Successfully marked all notifications as seen.');
  } catch (error) {
    console.error('Error marking notifications as seen:', error);
    process.exit(1);
  }
}

main();
