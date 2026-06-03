const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    if (body) console.log('Body:', body);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "OK" }));
  });
});

server.listen(8080, () => {
  console.log('Spy server listening on 8080');
  
  const cmd = `magicbell workflow save --data '{"key":"test-spy","steps":[]}' --api-url http://localhost:8080`;
  console.log(`Running: ${cmd}`);
  exec(cmd, (err, stdout, stderr) => {
    console.log('CLI stdout:', stdout);
    console.log('CLI stderr:', stderr);
    server.close();
  });
});
