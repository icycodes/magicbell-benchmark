# List Inbox Tokens via Node.js UserClient

## Background
MagicBell provides a Node.js SDK (`magicbell-js`) that includes a `UserClient` for actions performed on behalf of a specific user. In this task, you will create a script to list all inbox tokens for a user using their User JWT.

## Requirements
- Write a Node.js script that uses `magicbell-js/user-client` to fetch the inbox tokens for the user identified by the email `{MAGICBELL_EMAIL}+list-tokens-{run-id}@gmail.com`.
- Generate a User JWT locally using `jsonwebtoken` with your project's `MAGICBELL_API_KEY` and `MAGICBELL_SECRET_KEY`.
- Authenticate the `UserClient` with the generated User JWT.
- Fetch the inbox tokens using the `channels.listInboxTokens` method.
- Output the fetched tokens array to a JSON file.

## Implementation Hints
- Read the `run-id` from the `ZEALT_RUN_ID` environment variable.
- The user's email should be formatted as `{MAGICBELL_EMAIL}+list-tokens-${run-id}@gmail.com`.
- The User JWT payload requires `user_email` and `api_key`. Sign it using `MAGICBELL_SECRET_KEY` and the `HS256` algorithm.
- Initialize `Client` from `magicbell-js/user-client` passing the `token`.
- Call `client.channels.listInboxTokens()` and extract the `data` array.
- Write the resulting array to `/home/user/magicbell-nodejs-list-inbox-tokens/output.json`.

## Acceptance Criteria
- Project path: /home/user/magicbell-nodejs-list-inbox-tokens
- Ensure the script is executed and the artifacts exist.
- Log file: /home/user/magicbell-nodejs-list-inbox-tokens/output.json
- The output file must contain a valid JSON array.
