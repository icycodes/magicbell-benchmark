# Broadcast to a Topic using MagicBell Node.js SDK

## Background
MagicBell allows you to send notifications to specific users or to all users subscribed to a specific topic. You need to create a Node.js script that broadcasts a notification to both a specific email address and all subscribers of a given topic.

## Requirements
- Write a Node.js script to create a broadcast using the `magicbell-js` SDK.
- The broadcast must have the topic `announcements-${run-id}`.
- The broadcast title must be `Topic Broadcast ${run-id}`.
- The broadcast must target two types of recipients simultaneously:
  1. A specific user identified by the email `{MAGICBELL_EMAIL}+${run-id}@gmail.com`.
  2. All existing subscribers of the topic.
- Execute the script and save the output to a log file.

## Implementation Hints
- Read the `run-id` from the `ZEALT_RUN_ID` environment variable.
- Read `MAGICBELL_EMAIL` from the environment variables to construct the specific email recipient.
- Use the `ProjectClient` from the `magicbell-js` SDK to authenticate and create the broadcast.
- Be careful with the recipient syntax for topic subscribers. MagicBell requires a specific nested object format to target subscribers of a topic rather than treating the topic name as a raw recipient ID.
- Print the raw JSON response data returned by the `createBroadcast` API call to the required log file.

## Acceptance Criteria
- Project path: /home/user/task
- Ensure the script is executed and the artifacts exist.
- Log file: /home/user/task/output.log
- The script must use the MagicBell Node.js SDK to create the broadcast.
- The broadcast topic must be `announcements-${run-id}`.
- The broadcast title must be `Topic Broadcast ${run-id}`.
- The recipients must correctly include both the specific email and the topic subscribers flag.
- The log file must contain the raw JSON string of the created broadcast data (the `.data` property of the API response).

