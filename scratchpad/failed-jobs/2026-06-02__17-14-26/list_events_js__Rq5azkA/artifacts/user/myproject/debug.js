const { Client } = require('magicbell-js/project-client');
const client = new Client({ secretKey: 'test' });
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client.events)));
