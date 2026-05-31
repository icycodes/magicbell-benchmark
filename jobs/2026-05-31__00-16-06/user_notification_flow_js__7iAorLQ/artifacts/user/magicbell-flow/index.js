import { Client as ProjectClient } from 'magicbell-js/project-client';
import { Client as UserClient } from 'magicbell-js/user-client';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const runId = process.env.ZEALT_RUN_ID;
const gmailUserName = process.env.GMAIL_USER_NAME;
const apiKey = process.env.MAGICBELL_API_KEY;
const secretKey = process.env.MAGICBELL_SECRET_KEY;
const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;

const externalId = `usr_${runId}`;
const email = `${gmailUserName}+${runId}@gmail.com`;

const userJwt = jwt.sign({
  user_external_id: externalId,
  user_email: email,
  api_key: apiKey
}, secretKey, { algorithm: 'HS256' });

fs.writeFileSync('/home/user/magicbell-flow/user_jwt.txt', userJwt);
// Clear log file
fs.writeFileSync('/home/user/magicbell-flow/flow.log', '');

const pc = new ProjectClient({ token: projectToken });
const uc = new UserClient({ token: userJwt });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  try {
    // Save/upsert user
    await pc.users.saveUser({
      externalId,
      email,
      firstName: 'Test',
      lastName: 'User'
    });

    // Create broadcast
    const broadcastTitle = `Alert - ${runId}`;
    const broadcastRes = await pc.broadcasts.createBroadcast({
      title: broadcastTitle,
      content: `This is a test notification for run ${runId}.`,
      recipients: [
        { externalId, email }
      ]
    });
    const broadcastId = broadcastRes.data.id;
    fs.appendFileSync('/home/user/magicbell-flow/flow.log', `Broadcast ID: ${broadcastId}\n`);

    // Poll for notification
    let notification;
    for (let i = 0; i < 20; i++) {
      const listRes = await uc.notifications.listNotifications();
      notification = listRes.data.data.find(n => n.title === broadcastTitle && n.readAt === null);
      if (notification) break;
      await sleep(2000);
    }

    if (!notification) {
      throw new Error('Notification not found after waiting');
    }

    fs.appendFileSync('/home/user/magicbell-flow/flow.log', `Notification ID: ${notification.id}\n`);

    const initialState = notification.readAt === null ? 'unread' : 'read';
    fs.appendFileSync('/home/user/magicbell-flow/flow.log', `Notification Initial State: ${initialState}\n`);

    // Mark as read
    await uc.notifications.markNotificationRead(notification.id);

    // List again to verify
    const listRes2 = await uc.notifications.listNotifications();
    const notification2 = listRes2.data.data.find(n => n.id === notification.id);
    const updatedState = notification2.readAt === null ? 'unread' : 'read';
    fs.appendFileSync('/home/user/magicbell-flow/flow.log', `Notification Updated State: ${updatedState}\n`);

  } catch (e) {
    console.error('Error', e.error || e);
    process.exit(1);
  }
}

run();