const fs = require('fs');
async function run() {
  const res = await fetch('https://www.magicbell.com/docs/api/openapi.project.json');
  const data = await res.json();
  const paths = Object.keys(data.paths).filter(p => p.includes('workflow'));
  for (const p of paths) {
    console.log(p, Object.keys(data.paths[p]));
  }
}
run();
