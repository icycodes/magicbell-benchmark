async function inspectSpec() {
  const url = 'https://www.magicbell.com/docs/api/openapi.project.json';
  console.log(`Fetching OpenAPI spec from ${url}...`);
  const response = await fetch(url);
  const spec = await response.json();
  
  console.log('Paths in OpenAPI spec:');
  const paths = Object.keys(spec.paths);
  for (const path of paths) {
    if (path.includes('workflow')) {
      console.log(`  ${path}:`);
      const methods = Object.keys(spec.paths[path]);
      for (const method of methods) {
        console.log(`    - ${method.toUpperCase()}`);
      }
    }
  }
}

inspectSpec().catch(err => console.error(err));
