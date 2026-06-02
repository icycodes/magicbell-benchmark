'use strict';

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { ProjectClient } = require('magicbell/project-client');
const { UserClient } = require('magicbell/user-client');

// ── helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── env ───────────────────────────────────────────────────────────────────────

const runId          = process.env.ZEALT_RUN_ID;
const magicbellEmail = process.env.MAGICBELL_EMAIL;
const projectToken   = process.env.MAGICBELL_PROJECT_TOKEN;
const apiKey         = process.env.MAGICBELL_API_KEY;
const secretKey      = process.env.MAGICBELL_SECRET_KEY;

for (const [name, val] of Object.entries({
  ZEALT_RUN_ID:           runId,
  MAGICBELL_EMAIL:        magicbellEmail,
  MAGICBELL_PROJECT_TOKEN: projectToken,
  MAGICBELL_API_KEY:      apiKey,
  MAGICBELL_SECRET_KEY:   secretKey,
})) {
  if (!val) { console.error(`Missing env var: ${name}`); process.exit(1); }
}

// ── per-run identifiers ───────────────────────────────────────────────────────

const [local, domain] = magicbellEmail.split('@');
const recipientEmail  = `${local}+mark-read-js-${runId}@${domain}`;
const externalId      = `user-mark-read-js-${runId}`;
const notifTitle      = `Mark Read JS - ${runId}`;

console.log(`Run ID       : ${runId}`);
console.log(`Recipient    : ${recipientEmail}`);
console.log(`External ID  : ${externalId}`);
console.log(`Notif title  : ${notifTitle}`);

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Step 1: Initialise Project Client ────────────────────────────────────
  const projectClient = new ProjectClient({ token: projectToken });

  // ── Step 2: Upsert user ───────────────────────────────────────────────────
  console.log('\n[1] Upserting MagicBell user …');
  try {
    const createResp = await projectClient.users.create({
      external_id: externalId,
      email:       recipientEmail,
      first_name:  'MarkRead',
      last_name:   `JS-${runId}`,
    });
    console.log('    User created, id:', createResp.id ?? JSON.stringify(createResp));
  } catch (err) {
    // Already exists → update via external_id
    console.log(`    Create failed (${err.message}); falling back to updateByExternalId …`);
    const updateResp = await projectClient.users.updateByExternalId(externalId, {
      email:      recipientEmail,
      first_name: 'MarkRead',
      last_name:  `JS-${runId}`,
    });
    console.log('    User updated, id:', updateResp.id ?? JSON.stringify(updateResp));
  }

  // ── Step 3: Send broadcast ────────────────────────────────────────────────
  console.log('\n[2] Sending broadcast …');
  const broadcastResp = await projectClient.broadcasts.create({
    title:      notifTitle,
    content:    `Notification for mark-read JS run ${runId}.`,
    recipients: [{ external_id: externalId }],
  });
  console.log('    Broadcast ID:', broadcastResp.id ?? JSON.stringify(broadcastResp));

  // ── Step 4: Mint User JWT ─────────────────────────────────────────────────
  console.log('\n[3] Minting User JWT …');
  const userToken = jwt.sign(
    {
      user_email:       recipientEmail,
      user_external_id: externalId,
      api_key:          apiKey,
    },
    secretKey,
    { algorithm: 'HS256', expiresIn: '1y' },
  );
  console.log('    JWT minted (first 40 chars):', userToken.slice(0, 40) + '…');

  // ── Step 5: Initialise User Client ───────────────────────────────────────
  const userClient = new UserClient({ token: userToken });

  // ── Step 6: Poll for the notification ────────────────────────────────────
  console.log('\n[4] Polling for notification …');
  let notificationId = null;
  const MAX_ATTEMPTS = 12;
  const DELAY_MS     = 5000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`    Attempt ${attempt}/${MAX_ATTEMPTS} …`);
    try {
      const listResp = await userClient.notifications.list({ per_page: 50 });
      // Response is the direct object: { notifications: [...], total, ... }
      const items = listResp.notifications ?? [];

      const match = items.find((n) => n.title === notifTitle);
      if (match) {
        notificationId = match.id;
        console.log(`    Found notification: ${notificationId}`);
        break;
      } else {
        console.log(`    Not yet found (total items: ${items.length})`);
      }
    } catch (err) {
      console.warn(`    List error: ${err.message}`);
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(DELAY_MS);
    }
  }

  if (!notificationId) {
    throw new Error(`Notification with title "${notifTitle}" not found after ${MAX_ATTEMPTS} attempts.`);
  }

  // ── Step 7: Mark as read ──────────────────────────────────────────────────
  console.log('\n[5] Marking notification as read …');
  await userClient.notifications.markAsRead(notificationId);
  console.log('    Notification marked as read.');

  // ── Step 8: Write output ──────────────────────────────────────────────────
  const outputPath = path.join(__dirname, 'output.log');
  fs.writeFileSync(outputPath, `Notification ID: ${notificationId}\n`, 'utf8');
  console.log(`\n[6] Written to ${outputPath}`);
  console.log(`    Notification ID: ${notificationId}`);
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
