const { Client } = require('magicbell-js/user-client');

const client = new Client({ token: 'test' });
console.log(client.core);
console.log(client.notifications.client.core);