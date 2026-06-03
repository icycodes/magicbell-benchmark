# Create a Broadcast to Multiple Recipients

## Background
MagicBell allows you to fan out a single notification to multiple recipients using a broadcast. In this task, you will use the MagicBell Node.js SDK to create a broadcast with a custom data payload, sending it to multiple email recipients.

## Requirements
- Write a Node.js script to create a broadcast using the `magicbell-js` SDK.
- The broadcast title must be `Test Broadcast ${run-id}` where `${run-id}` is read from the `ZEALT_RUN_ID` environment variable.
- The broadcast must include a custom data payload (e.g., `{"custom_key": "custom_value"}`).
- The broadcast must be sent to two recipients. Construct their email addresses using the `MAGICBELL_EMAIL` environment variable in the plus format: `${MAGICBELL_EMAIL}+recipient1-${run-id}@gmail.com` and `${MAGICBELL_EMAIL}+recipient2-${run-id}@gmail.com`.
- The script must output the created broadcast ID to a log file.

## Implementation Hints
- Read `ZEALT_RUN_ID` and `MAGICBELL_EMAIL` from environment variables.
- Initialize the `Client` from `magicbell-js/project-client` using the `MAGICBELL_PROJECT_TOKEN` environment variable.
- Use the `createBroadcast` method to send the notification to the specified recipients.
- Write the resulting broadcast ID to `/home/user/project/output.log`.

## Acceptance Criteria
- Project path: `/home/user/project`
- Ensure the script is executed and the artifacts exist.
- Log file: `/home/user/project/output.log`
- In the log file, print the broadcast ID in the format `Broadcast ID: <broadcast_id>`.

