const { Client } = require('magicbell-js/project-client');
const client = new Client({ token: 'test' });
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client.users)));
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client.broadcasts)));
