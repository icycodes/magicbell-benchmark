# MagicBell Broadcast with Category

## Background
Create a script that uses the MagicBell Node.js SDK to send a broadcast notification with a specific category to a designated email address.

## Requirements
- Use the MagicBell Node.js SDK (`magicbell-js`) to create a broadcast.
- The broadcast must be sent to a single recipient using their email address.
- The recipient email must be formatted as `{MAGICBELL_EMAIL}+${run-id}@gmail.com`, where `MAGICBELL_EMAIL` is read from the environment and `run-id` is read from `ZEALT_RUN_ID`.
- The broadcast must include a category named `system-update`.
- The broadcast title must include the `run-id` to ensure uniqueness.
- Save the resulting Broadcast ID to a log file.

## Implementation Hints
- Read `MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, and `ZEALT_RUN_ID` from environment variables.
- Initialize the `ProjectClient` from `magicbell-js`.
- Use the `createBroadcast` method and provide the `title`, `content`, `category`, and `recipients` array containing the target email.
- Write the returned Broadcast ID to the output log.

## Acceptance Criteria
- Project path: /home/user/project
- Ensure the real broadcast creation action is executed and the log artifact exists.
- Log file: /home/user/project/output.log
- The log file must contain the Broadcast ID in the format: `Broadcast ID: <broadcast_id>`.
- The broadcast must be sent to the recipient `{MAGICBELL_EMAIL}+${run-id}@gmail.com`.
- The broadcast must have the category `system-update`.
- The broadcast title must include the `run-id`.

