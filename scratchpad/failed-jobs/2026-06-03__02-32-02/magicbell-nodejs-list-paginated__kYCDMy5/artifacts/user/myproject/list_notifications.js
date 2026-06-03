const { Client } = require('magicbell-js/user-client');

async function main() {
  const client = new Client({ token: process.env.USER_JWT });

  // Fetch first page of notifications with limit 2
  const page1Response = await client.notifications.listNotifications({ limit: 2 });
  const page1 = page1Response.notifications;
  const page1Ids = page1.map((n) => n.id);
  console.log(`Page 1: ${page1Ids.join(', ')}`);

  // Use the last notification ID from page 1 as the cursor for page 2
  const lastId = page1Ids[page1Ids.length - 1];
  const page2Response = await client.notifications.listNotifications({ limit: 2, startingAfter: lastId });
  const page2 = page2Response.notifications;
  const page2Ids = page2.map((n) => n.id);
  console.log(`Page 2: ${page2Ids.join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
