# Mark Notification as Read with Node.js UserClient

## Background
Create a Node.js script that uses the MagicBell UserClient (`magicbell-js`) to mark a specific notification as read for a specific user.

## Requirements
- Create a Node.js script that accepts a notification ID as a command-line argument.
- The script must generate a MagicBell User JWT for the user email `${MAGICBELL_EMAIL}+${run-id}@gmail.com`, where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- Initialize the MagicBell UserClient using the generated User JWT.
- Use the UserClient to mark the provided notification ID as read.
- Print a success message to stdout upon completion.

## Implementation Hints
- Generate the User JWT using the `jsonwebtoken` library with your `MAGICBELL_API_KEY` and `MAGICBELL_SECRET_KEY`.
- The payload of the User JWT must include `user_email` set to `${MAGICBELL_EMAIL}+${run-id}@gmail.com`.
- Import the UserClient from `magicbell-js/user-client` and initialize it with the generated token.
- Use the appropriate method on the `notifications` service of the UserClient to mark the notification as read.
- Read the notification ID from `process.argv`.

## Acceptance Criteria
- Project path: /home/user/project
- Command: node index.js <notification_id>
- The stdout should print: Notification <notification_id> marked as read.
- Ensure the specified notification is actually marked as read in the MagicBell system for the target user.

