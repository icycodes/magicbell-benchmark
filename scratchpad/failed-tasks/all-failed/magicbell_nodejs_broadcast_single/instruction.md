# MagicBell Node.js Broadcast

## Background
Use the MagicBell Node.js SDK (`magicbell-js`) to trigger a notification broadcast to a single user.

## Requirements
- Create a Node.js script that uses the MagicBell ProjectClient to send a notification broadcast.
- The broadcast must be sent to a single recipient using their email address.
- The recipient's email address must be constructed using the `MAGICBELL_EMAIL` and `ZEALT_RUN_ID` environment variables in the format: `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`.
- The broadcast title must be `Test Broadcast ${ZEALT_RUN_ID}`.
- The broadcast content can be any text.
- Ensure the script executes successfully and logs the created broadcast ID.

## Implementation Hints
- Read the environment variables `MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, and `ZEALT_RUN_ID`.
- Construct the recipient email using the plus addressing format.
- Initialize the MagicBell ProjectClient with the project token.
- Call the appropriate method on the `broadcasts` service to create a broadcast with the recipient's email, title, and content.
- Write the resulting broadcast ID to an output log file.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Ensure the script is executed and the artifacts exist.
- Log file: /home/user/magicbell-task/output.log
- The log file must contain the broadcast ID in the format: `Broadcast ID: <broadcast_id>`.
- A broadcast email must be delivered to `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com` with the title `Test Broadcast ${ZEALT_RUN_ID}`.

