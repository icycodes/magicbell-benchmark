const { Client } = require('magicbell-js/user-client');

const client = new Client({ token: 'test' });
console.log(Object.keys(client));
console.log(Object.keys(client.notifications));
console.log(Object.keys(client.notifications.client));