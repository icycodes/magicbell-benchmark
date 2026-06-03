# Delete a Notification via ProjectClient

## Background
MagicBell allows developers to manage notifications across multiple channels. Sometimes, you need to programmatically delete a specific notification from a user's inbox using a backend script.

## Requirements
- Write a Node.js script that creates a notification for a user (via broadcast), then deletes that specific notification programmatically using the Node.js ProjectClient.
- The recipient email must use the plus format of your `MAGICBELL_EMAIL` with the current `run-id` as the receiver ID. For example: `your-email+<run-id>@gmail.com`.
- The script must print the deleted notification ID to stdout.

## Implementation Hints
1. Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
2. Create a broadcast using the Node.js SDK to send a notification to the formatted email address.
3. Retrieve the created notification's ID. You may need to fetch the user's notifications or wait for the broadcast to be processed.
4. Use the ProjectClient (or raw API requests with Project Auth if the SDK method is missing) to delete the notification by its ID.
5. Print the deleted notification ID in the format: `Deleted Notification ID: <id>`.

## Acceptance Criteria
- Project path: /home/user/magicbell-project
- Ensure the script is executed and the real notification deletion action is performed.
- Command: `node delete_notification.js`
- The command output must include the deleted notification ID in the format: `Deleted Notification ID: <id>`.
- The notification must no longer exist in the user's inbox.
