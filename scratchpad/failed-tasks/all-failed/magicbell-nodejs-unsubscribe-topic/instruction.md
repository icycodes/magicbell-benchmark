# Unsubscribe User from a Topic

## Background
MagicBell allows users to subscribe to and unsubscribe from specific notification topics. When a user unsubscribes from a topic, they will no longer receive notifications for that topic, even if they are explicitly listed as a recipient of the notification.

## Requirements
- Write a Node.js script that uses the `magicbell-js/user-client` to unsubscribe a specific user from a specific topic.
- The user's email must be `[MAGICBELL_EMAIL]+[run-id]@gmail.com` (replace `[MAGICBELL_EMAIL]` with the value of the `MAGICBELL_EMAIL` environment variable, and `[run-id]` with the value of the `ZEALT_RUN_ID` environment variable).
- The topic to unsubscribe from must be `test-topic-[run-id]`.
- The script must be self-contained and executable via `node unsubscribe.js`.

## Implementation Hints
- Read the `ZEALT_RUN_ID` and `MAGICBELL_EMAIL` environment variables to construct the user's email and the topic name.
- You will need to generate a User JWT for this user using your `MAGICBELL_API_KEY` and `MAGICBELL_SECRET_KEY` (using `jsonwebtoken` or similar) to instantiate the `magicbell-js/user-client`.
- Use the UserClient's subscription management methods (e.g., `client.subscriptions.unsubscribe`) to unsubscribe from the topic.

## Acceptance Criteria
- Project path: /home/user/magicbell-unsubscribe
- Command: node unsubscribe.js
- Ensure the script is executed and the user is successfully unsubscribed from the topic `test-topic-[run-id]`.
- Verification will test this by sending a broadcast to the user with the topic `test-topic-[run-id]` and ensuring it is NOT received, while a broadcast with a different topic IS received.

