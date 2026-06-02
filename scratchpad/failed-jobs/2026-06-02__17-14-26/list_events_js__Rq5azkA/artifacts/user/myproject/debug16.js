const { Client } = require('magicbell-js/project-client');
console.log(Object.keys(new Client({ token: 'x' }).events));
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(new Client({ token: 'x' }).events)));
