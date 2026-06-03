const { Client } = require('magicbell-js/user-client');
const { CustomHook } = require('magicbell-js/user-client/http/hooks/custom-hook.js');
const jwt = require('jsonwebtoken');

const runId = process.env.ZEALT_RUN_ID || 'test';
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;

const userEmail = `${magicbellEmail}+${runId}@gmail.com`;
const token = jwt.sign({ user_email: userEmail }, secretKey, { algorithm: 'HS256' });

class MyHook extends CustomHook {
  async beforeRequest(request, params) {
    request.headers.set('X-MAGICBELL-API-KEY', apiKey);
    return request;
  }
}

// Since Client doesn't let us pass a hook, we can patch the HttpClient
const client = new Client({ token });

// client.channels.client is the HttpClient
client.channels.client.requestHandlerChain.addHandler({
  handle: async (request) => {
    request.headers.set('X-MAGICBELL-API-KEY', apiKey);
    return client.channels.client.requestHandlerChain.callChain(request); // wait, this would loop
  }
});

