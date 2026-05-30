# Send Broadcast Notification with MagicBell Node.js SDK

## Background
MagicBell is a real-time notification delivery platform. In this task, you will use the modern Node.js SDK (`magicbell-js`) to programmatically register a user and send them a broadcast notification.

## Requirements
- Create a Node.js project under `/home/user/myproject`.
- Install the modern `magicbell-js` SDK.
- Write a JavaScript script (`index.js`) that:
  1. Reads `ZEALT_RUN_ID` and `GMAIL_USER_NAME` from the environment variables.
  2. Creates/upserts a user in MagicBell with:
     - `externalId`: `user_<run-id>`
     - `email`: `<GMAIL_USER_NAME>+<run-id>@gmail.com`
     - `firstName`: `Test`
     - `lastName`: `User`
  3. Sends a broadcast notification to this user with:
     - `title`: `Welcome to MagicBell <run-id>!`
     - `content`: `This is a test notification for run <run-id>.`
     - `recipients`: Targeting the created user's `externalId`.
  4. Writes the created broadcast ID to `/home/user/myproject/output.log` in the format: `Broadcast ID: <broadcast_id>`.
- Execute the script to trigger the real action.

## Implementation Hints
- Use `magicbell-js/project-client` to initialize the administrative `Client`.
- Authenticate the client using the `MAGICBELL_PROJECT_TOKEN` environment variable.
- Make sure to handle environment variables properly and handle asynchronous operations in Node.js.
- Ensure that the script is fully non-interactive and can run to completion.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the script is executed and the artifacts exist.
- Log file: /home/user/myproject/output.log
- The log file must contain the broadcast ID in the format: `Broadcast ID: <broadcast_id>`.

