const { Client } = require('magicbell-js/project-client');

const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

const client = new Client({ token: secretKey }); 

client.users.listUsers().then(console.log).catch(console.error);
