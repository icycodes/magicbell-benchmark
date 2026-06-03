const { Client } = require('magicbell-js/user-client');
const jwt = require('jsonwebtoken');

const runId = "test-run";
const email = `test+${runId}@gmail.com`;
const apiKey = "test-api-key";
const secretKey = "test-secret-key";

const token = jwt.sign({ user_email: email, api_key: apiKey }, secretKey, { algorithm: 'HS256' });

const client = new Client({ token: token });

console.log(client);
