const { Client } = require('magicbell-js/user-client');
console.log('Client class:', Client);
const client = new Client({ token: 'dummy_token' });
console.log('Client instance properties:', Object.getOwnPropertyNames(client));
console.log('Client prototype properties:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
console.log('Client.notifications properties:', Object.getOwnPropertyNames(client.notifications));
console.log('Client.notifications prototype properties:', Object.getOwnPropertyNames(Object.getPrototypeOf(client.notifications)));
