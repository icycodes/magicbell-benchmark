# Mark All Notifications as Seen

## Background
You are building a notification system using MagicBell. You need to write a Node.js script that marks all notifications for a specific user as seen using the `magicbell-js` UserClient.

## Requirements
- Write a Node.js script that initializes the MagicBell UserClient.
- The script must mark all notifications for a specific user as seen.
- The user's email must be constructed using the `MAGICBELL_EMAIL` and `ZEALT_RUN_ID` environment variables in the plus format: `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`.
- You must generate a User JWT to authenticate the UserClient, using the `MAGICBELL_API_KEY` and `MAGICBELL_SECRET_KEY` provided in the environment.

## Implementation Hints
- Read the `MAGICBELL_EMAIL` and `ZEALT_RUN_ID` environment variables.
- Construct the email string: `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`.
- Generate a User JWT signed with `HS256` using the `MAGICBELL_SECRET_KEY`. The payload should include `user_email` and `api_key`.
- Initialize the `Client` from `magicbell-js/user-client` with the generated token.
- Use the client to mark all notifications as seen. If a dedicated method like `markAllNotificationsSeen` is not available, you can use the underlying `core.fetch` to make a POST request to `/notifications/seen`.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Command: `node index.js`
- The script must read `MAGICBELL_EMAIL` and `ZEALT_RUN_ID` to construct the target user's email.
- The script must successfully mark all of the user's notifications as seen in MagicBell.
- The stdout should print a success message once completed.

