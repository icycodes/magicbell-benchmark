const { Client } = require('magicbell-js/project-client');
const client = new Client({ accessToken: 'token' });
console.log(client.config);
