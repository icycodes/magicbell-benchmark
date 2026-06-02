async function tryGraphQL(query) {
  try {
    const res = await fetch('https://api.magicbell.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MAGICBELL_PROJECT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    console.log(`GraphQL -> Data:`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error GraphQL:`, err);
  }
}

async function main() {
  await tryGraphQL(`
    query {
      __type(name: "Project") {
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
  `);
}

main().catch(console.error);
