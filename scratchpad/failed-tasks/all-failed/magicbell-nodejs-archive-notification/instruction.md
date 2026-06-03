# Archive a Notification with MagicBell Node.js UserClient

## Background
You need to use the MagicBell Node.js SDK to archive a user's notification. MagicBell provides a UserClient for client-side/user-context operations, which requires a User JWT for authentication.

## Requirements
- Write and execute a Node.js script that creates and then archives a notification for a specific user.
- The target user's email is `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`, where `MAGICBELL_EMAIL` and `ZEALT_RUN_ID` are environment variables.
- Use the MagicBell ProjectClient (`magicbell-js/project-client`) to create a broadcast to this user. This will generate a notification in their inbox.
- Generate a User JWT for this user using your MagicBell API Key and Secret Key.
- Use the MagicBell UserClient (`magicbell-js/user-client`) initialized with the User JWT to fetch the user's notifications.
- Archive the most recent notification.
- Write the ID of the archived notification to a log file.

## Implementation Hints
1. Initialize the MagicBell ProjectClient with `MAGICBELL_PROJECT_TOKEN` and create a broadcast to the user's email.
2. Use the `jsonwebtoken` package to sign a User JWT (`HS256` algorithm) using `MAGICBELL_API_KEY` and `MAGICBELL_SECRET_KEY`.
3. Initialize the MagicBell UserClient with the generated User JWT.
4. Fetch the notifications for the user, pick the first one, and archive it using the UserClient.
5. Write the archived notification ID to `output.log`.

## Acceptance Criteria
- Project path: /home/user/project
- Ensure the script is executed and the log artifact exists.
- Log file: /home/user/project/output.log
- The log file must contain the archived notification ID in the format: `Archived Notification ID: <id>`.
- The notification must actually be archived in MagicBell.

