# MagicBell Full-Stack Notification Flow in Node.js

## Background
In modern web applications, notification delivery needs to be orchestrated across multiple channels (e.g., in-app inbox and email) while keeping state synced in real-time. MagicBell provides a unified platform to trigger broadcasts and manage user-specific notification states.

In this task, you will implement a Node.js script that performs a complete user notification flow: generating a secure User JWT, registering/saving a user, triggering an administrative broadcast, fetching the user's notifications, and marking the notification as read.

## Requirements
1. Create a Node.js project under `/home/user/magicbell-flow`.
2. Read the run ID from the `ZEALT_RUN_ID` environment variable.
3. Read the Gmail username from the `GMAIL_USER_NAME` environment variable.
4. Construct the test user's attributes:
   - `external_id`: `usr_${run-id}`
   - `email`: `${GMAIL_USER_NAME}+${run-id}@gmail.com`
5. Generate a secure User JWT for this user using HMAC-HS256 signed with your project's `MAGICBELL_SECRET_KEY` and containing the `MAGICBELL_API_KEY`.
6. Write the generated User JWT to `/home/user/magicbell-flow/user_jwt.txt`.
7. Use the modern `magicbell-js` SDK's `ProjectClient` (administrative) to:
   - Save/upsert the user with the constructed `externalId`, `email`, and first name `Test` / last name `User`.
   - Create a broadcast with:
     - title: `Alert - ${run-id}`
     - content: `This is a test notification for run ${run-id}.`
     - recipients: A list containing a single recipient with the constructed `externalId` and `email`.
8. Use the modern `magicbell-js` SDK's `UserClient` (user context, initialized with the generated User JWT) to:
   - List the user's notifications.
   - Find the newly created notification by title.
   - Verify it is unread, and print its initial state to `/home/user/magicbell-flow/flow.log`.
   - Mark the notification as read using its ID.
   - List notifications again, and print its updated state to `/home/user/magicbell-flow/flow.log`.

## Implementation Hints
- Use the `jsonwebtoken` package to sign the User JWT. Ensure the payload structure matches the MagicBell User JWT specification.
- Use `magicbell-js/project-client` for administrative operations and `magicbell-js/user-client` for user operations.
- Handle asynchronous operations properly in Node.js.
- Ensure all output strings in the log file are correctly formatted to match the acceptance criteria.

## Acceptance Criteria
- Project path: `/home/user/magicbell-flow`
- Ensure the script is executed and the artifacts exist.
- Log file: `/home/user/magicbell-flow/flow.log`
- The file `/home/user/magicbell-flow/user_jwt.txt` must exist and contain only the generated User JWT.
- The log file `/home/user/magicbell-flow/flow.log` must contain the following lines exactly:
  - `Broadcast ID: <broadcast_id>`
  - `Notification ID: <notification_id>`
  - `Notification Initial State: unread`
  - `Notification Updated State: read`

