async function test() {
  const mod = await import('magicbell-js/project-client');
  console.log(Object.keys(mod));
}
test();
