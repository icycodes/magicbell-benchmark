const jwt = require('jsonwebtoken');
const fs = require('fs');
const { Client } = require('magicbell-js/user-client');

async function main() {
    const apiKey = process.env.MAGICBELL_API_KEY;
    const secretKey = process.env.MAGICBELL_SECRET_KEY;
    const runId = process.env.ZEALT_RUN_ID;

    if (!apiKey || !secretKey || !runId) {
        console.error("Missing required environment variables");
        process.exit(1);
    }

    const payload = {
        user_email: `user-${runId}@gmail.com`,
        user_external_id: `ext-${runId}`,
        api_key: apiKey
    };

    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256', expiresIn: '1h' });

    fs.writeFileSync('/home/user/myproject/user_jwt.txt', token);

    let logContent = `User JWT: ${token}\n`;

    try {
        const client = new Client({
            token: token
        });

        // Use listNotifications
        const notifications = await client.notifications.listNotifications({ limit: 5 });
        
        logContent += `API Status: Success\n`;
    } catch (error) {
        logContent += `API Status: Failed - ${error.message}\n`;
        console.error(error);
    }

    fs.writeFileSync('/home/user/myproject/output.log', logContent);
}

main();