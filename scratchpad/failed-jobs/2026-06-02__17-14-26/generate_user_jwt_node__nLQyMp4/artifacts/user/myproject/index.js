const fs = require('fs');
const jwt = require('jsonwebtoken');

async function main() {
    const emailBase = process.env.MAGICBELL_EMAIL;
    const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;
    const runId = process.env.ZEALT_RUN_ID;

    if (!emailBase || !projectToken || !apiKey || !secretKey || !runId) {
        console.error("Missing environment variables");
        process.exit(1);
    }

    const [local, domain] = emailBase.split('@');
    const perRunEmail = `${local}+jwt-node-${runId}@${domain}`;
    const externalId = `user-jwt-node-${runId}`;

    // Upsert user
    const response = await fetch('https://api.magicbell.com/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${projectToken}`
        },
        body: JSON.stringify({
            user: {
                email: perRunEmail,
                external_id: externalId
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Failed to upsert user", response.status, err);
        process.exit(1);
    }

    // Generate JWT
    const payload = {
        user_email: perRunEmail,
        user_external_id: externalId,
        api_key: apiKey
    };

    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256', expiresIn: '1y' });

    fs.writeFileSync('/home/user/myproject/output.log', `User JWT: ${token}\n`);
    console.log("Done");
}

main().catch(console.error);
