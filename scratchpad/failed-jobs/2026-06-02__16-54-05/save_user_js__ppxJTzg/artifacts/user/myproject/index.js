import { Client } from 'magicbell-js/project-client';
import fs from 'fs';

async function main() {
  try {
    const runId = process.env.ZEALT_RUN_ID;
    const magicbellEmail = process.env.MAGICBELL_EMAIL;
    const token = process.env.MAGICBELL_PROJECT_TOKEN;

    if (!runId) {
      throw new Error("ZEALT_RUN_ID environment variable is missing");
    }
    if (!magicbellEmail) {
      throw new Error("MAGICBELL_EMAIL environment variable is missing");
    }
    if (!token) {
      throw new Error("MAGICBELL_PROJECT_TOKEN environment variable is missing");
    }

    const parts = magicbellEmail.split('@');
    if (parts.length !== 2) {
      throw new Error("MAGICBELL_EMAIL is not a valid email address");
    }
    const local = parts[0];
    const domain = parts[1];
    const plusAddressedEmail = `${local}+save-user-js-${runId}@${domain}`;

    console.log(`Initialized client with token: ${token.substring(0, 4)}...`);
    const client = new Client({ token });

    const externalId = `user-${runId}`;
    const firstName = 'Save';
    const lastName = `User-${runId}`;

    console.log(`Upserting user: email=${plusAddressedEmail}, externalId=${externalId}`);

    const response = await client.users.saveUser({
      externalId,
      email: plusAddressedEmail,
      firstName,
      lastName
    });

    console.log('Response metadata status:', response?.metadata?.status);
    console.log('Response data:', JSON.stringify(response?.data, null, 2));

    let userId = response?.data?.id;
    if (!userId && response?.id) {
      userId = response.id;
    }

    if (!userId) {
      throw new Error("Could not find user ID in the response");
    }

    console.log(`Successfully upserted user. User ID: ${userId}`);

    fs.writeFileSync('/home/user/myproject/output.log', `User ID: ${userId}\n`);
    console.log("Logged user ID to /home/user/myproject/output.log");
  } catch (error) {
    console.error("Error occurred:", error);
    process.exit(1);
  }
}

main();
