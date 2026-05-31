const jwt = require('jsonwebtoken');
const fs = require('fs');
const https = require('https');

async function fetchJSON(url, options) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data || '{}')));
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function main() {
    const runId = process.env.ZEALT_RUN_ID || 'test';
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;

    const userEmail = `user-${runId}@example.com`;
    const userExternalId = `user_${runId}`;

    const payload = {
        user_email: userEmail,
        user_external_id: userExternalId,
        api_key: apiKey
    };

    const userJwt = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

    const headers = {
        'Authorization': `Bearer ${userJwt}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Version': 'v2'
    };

    const updateRes = await fetchJSON('https://api.magicbell.com/notification_preferences', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            notification_preferences: {
                categories: [
                    {
                        slug: 'billing',
                        channels: [
                            { slug: 'email', enabled: false }
                        ]
                    }
                ]
            }
        })
    });
    console.log("Update response:", JSON.stringify(updateRes, null, 2));

    const getRes = await fetchJSON('https://api.magicbell.com/notification_preferences', {
        method: 'GET',
        headers
    });
    console.log("Get response:", JSON.stringify(getRes, null, 2));
}

main().catch(console.error);