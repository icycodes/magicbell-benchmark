# MagicBell Node.js SDK: Broadcast with Custom Overrides

## Background
You are building a notification system using the MagicBell Node.js SDK (`magicbell-js`). You need to send a broadcast to a user but explicitly disable the email channel for this specific broadcast using the broadcast's overrides configuration.

## Requirements
- Initialize the MagicBell Node.js project client using the `MAGICBELL_PROJECT_TOKEN`.
- Create a broadcast with the title "Test Broadcast" and some content.
- The broadcast must be sent to a single recipient with the email `{MAGICBELL_EMAIL}+${run-id}@gmail.com`, where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- Configure the broadcast's `overrides` to disable the email channel (so the notification is only delivered via other channels like in-app).
- Execute the script and save the resulting broadcast ID to a log file.

## Implementation Hints
- Use the `magicbell-js` SDK (`npm install magicbell-js`).
- Read `ZEALT_RUN_ID` and `MAGICBELL_EMAIL` from the environment.
- Pass the appropriate `overrides` object in the broadcast creation payload to disable the email channel or provider.
- Write a Node.js script that performs the action and writes the result to `output.log`.

## Acceptance Criteria
- Project path: `/home/user/magicbell-project`
- Ensure the script is executed and the artifact exists.
- Log file: `/home/user/magicbell-project/output.log`
- The log file must contain the broadcast ID in the format: `Broadcast ID: <broadcast_id>`

