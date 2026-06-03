const { Client } = require('magicbell-js/user-client');

async function main() {
  const token = process.env.USER_JWT;
  if (!token) {
    console.error('USER_JWT environment variable is required');
    process.exit(1);
  }

  const client = new Client({ token });

  // Fetch the first page of notifications with limit 2
  const page1Response = await client.notifications.listNotifications({ limit: 2 });
  const page1Notifications = page1Response.data.data;
  const page1Ids = page1Notifications.map((n) => n.id);
  console.log(`Page 1: ${page1Ids.join(', ')}`);

  // Use the ID of the last notification from page 1 as startingAfter for page 2
  const lastId = page1Notifications[page1Notifications.length - 1].id;
  const page2Response = await client.notifications.listNotifications({
    limit: 2,
    startingAfter: lastId,
  });
  const page2Notifications = page2Response.data.data;
  const page2Ids = page2Notifications.map((n) => n.id);
  console.log(`Page 2: ${page2Ids.join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});