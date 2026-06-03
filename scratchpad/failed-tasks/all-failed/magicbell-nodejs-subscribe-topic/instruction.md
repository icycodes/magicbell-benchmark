# Subscribe a User to a Topic using Node.js

## Background
MagicBell allows users to subscribe to specific topics to receive notifications. You need to write a Node.js script that generates a User JWT and subscribes a specific user to a topic.

## Requirements
- Write a Node.js script that subscribes a user to a topic.
- The user's external ID must be `user-topic-sub-${run-id}`.
- The user's email must be derived from the `MAGICBELL_EMAIL` environment variable using the plus-addressing format: `<local>+topic-sub-${run-id}@<domain>` (e.g., if `MAGICBELL_EMAIL` is `admin@gmail.com`, the user email should be `admin+topic-sub-${run-id}@gmail.com`).
- The topic name must be `updates-${run-id}`.
- Use the `magicbell-js` UserClient or the REST API to perform the subscription. Note that if the UserClient does not expose subscription management, you may need to fallback to standard REST HTTP requests (e.g. `POST /subscriptions` with `X-MAGICBELL-API-KEY` and `X-MAGICBELL-USER-EXTERNAL-ID` headers).
- Run the script and save the output to a log file.

## Implementation Hints
- Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
- Parse `MAGICBELL_EMAIL` to construct the target user email.
- Generate a User JWT using the `jsonwebtoken` package with your `MAGICBELL_SECRET_KEY` and `MAGICBELL_API_KEY`.
- Make sure the user is saved/created in MagicBell (you can do this via the ProjectClient or by just interacting with the user endpoints).
- Subscribe the user to the topic using the appropriate API endpoint.
- Ensure your script writes its success output to `/home/user/myproject/output.log`.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the script is executed and the artifacts exist.
- Log file: /home/user/myproject/output.log
- The script must successfully subscribe the user to the topic `updates-${run-id}`.
- The log file must contain the text: `Subscription successful`.

