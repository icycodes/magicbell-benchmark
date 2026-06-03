const { Client } = require('magicbell-js/user-client');

async function main() {
  const token = process.env.USER_JWT;
  if (!token) {
    console.error('USER_JWT environment variable is required');
    process.exit(1);
  }

  const client = new Client({ token: token });

  try {
    const page1 = await client.notifications.listNotifications({ limit: 2 });
    
    if (page1 && page1.data && page1.data.data && page1.data.data.length > 0) {
      const page1Ids = page1.data.data.map(n => n.id);
      console.log(`Page 1: ${page1Ids.join(', ')}`);
      
      const lastId = page1Ids[page1Ids.length - 1];
      
      const page2 = await client.notifications.listNotifications({ limit: 2, startingAfter: lastId });
      if (page2 && page2.data && page2.data.data) {
        const page2Ids = page2.data.data.map(n => n.id);
        console.log(`Page 2: ${page2Ids.join(', ')}`);
      }
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
}

main();
