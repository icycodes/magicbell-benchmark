const { Client } = require('magicbell-js/user-client');

async function main() {
  const token = process.env.USER_JWT;
  if (!token) {
    console.error('USER_JWT environment variable is required');
    process.exit(1);
  }

  const client = new Client({ token });

  // Page 1
  const response1 = await client.notifications.listNotifications({ limit: 2 });
  const notifications1 = response1.data && response1.data.data ? response1.data.data : [];
  const ids1 = notifications1.map(n => n.id);
  console.log(`Page 1: ${ids1.join(', ')}`);

  // Page 2
  if (ids1.length > 0) {
    const lastId = ids1[ids1.length - 1];
    const response2 = await client.notifications.listNotifications({ limit: 2, startingAfter: lastId });
    const notifications2 = response2.data && response2.data.data ? response2.data.data : [];
    const ids2 = notifications2.map(n => n.id);
    console.log(`Page 2: ${ids2.join(', ')}`);
  } else {
    console.log('Page 2: ');
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
