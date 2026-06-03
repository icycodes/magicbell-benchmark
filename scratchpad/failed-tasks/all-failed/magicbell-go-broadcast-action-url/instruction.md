# Create a Broadcast with an Action URL using Go SDK

## Background
You have access to the MagicBell Go SDK. Write a Go script to create a broadcast notification that includes a custom action URL. This URL directs users to a specific page when they click the notification.

## Requirements
- Write a Go script (`main.go`) that uses the MagicBell Go SDK `ProjectClient` to create a broadcast.
- The broadcast must have a title and content of your choice.
- The broadcast must include a custom action URL (e.g., `https://example.com/action-${run-id}`).
- The broadcast recipient must be specified by email. Use the plus format of the provided `MAGICBELL_EMAIL` with the current `run-id` (i.e., `${MAGICBELL_EMAIL}+${run-id}@gmail.com`).
- Save the resulting Broadcast ID to a log file.

## Implementation Hints
1. Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
2. Read the `MAGICBELL_EMAIL` and `MAGICBELL_PROJECT_TOKEN` environment variables.
3. Configure the MagicBell Go SDK `ProjectClient` using the project token.
4. Construct a `CreateBroadcastRequest` with the title, content, action URL, and the recipient email (`${MAGICBELL_EMAIL}+${run-id}@gmail.com`).
5. Execute the broadcast creation and write the resulting Broadcast ID to `/home/user/project/output.log`.

## Acceptance Criteria
- Project path: /home/user/project
- Ensure the real broadcast creation action is executed and the log artifact exists.
- Log file: /home/user/project/output.log
- The log file must contain the broadcast ID in the format: `Broadcast ID: <broadcast_id>`.
- The broadcast must be sent to the email address constructed as `${MAGICBELL_EMAIL}+${run-id}@gmail.com`.
- The broadcast must include an action URL.

