# Fetch a Notification by ID using Node.js UserClient

## Background
You need to fetch a specific notification by ID for a user using the MagicBell Node.js UserClient.

## Requirements
- Create a Node.js script `fetch.js`.
- The script must generate a MagicBell User JWT for the user with `external_id` set to `user_${run-id}` (where `run-id` is read from the `ZEALT_RUN_ID` environment variable). The JWT should also include `user_email` as `{MAGICBELL_EMAIL}+user_${run-id}@gmail.com` and `api_key` as `process.env.MAGICBELL_API_KEY`. Sign it with `process.env.MAGICBELL_SECRET_KEY` using the `HS256` algorithm.
- The script must initialize the `Client` from `magicbell-js/user-client` using the generated User JWT.
- The script must take a notification ID as a command-line argument.
- The script must fetch the notification using the UserClient and print its title to stdout.

## Implementation Hints
- Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
- Generate a User JWT using the `jsonwebtoken` library.
- Initialize `Client` from `magicbell-js/user-client` with the token.
- Use the `fetchNotification` method on the `notifications` service to fetch the notification by ID.
- Print the title to stdout in the format `Title: <title>`.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Command: node fetch.js <notification_id>
- The command must accept the notification ID as its first argument.
- The stdout should print the notification title in the format: `Title: <title>`.

