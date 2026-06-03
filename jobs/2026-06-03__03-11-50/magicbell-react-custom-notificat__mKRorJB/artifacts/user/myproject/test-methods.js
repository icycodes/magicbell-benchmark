const { Client } = require('magicbell-js/project-client');
const client = new Client({ token: 'test' });
console.log(Object.keys(client.users));
console.log(Object.keys(client.broadcasts));
