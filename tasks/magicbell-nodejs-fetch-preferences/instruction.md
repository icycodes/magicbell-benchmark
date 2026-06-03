# Fetch User Notification Preferences with Node.js

## Background
MagicBell allows users to manage their notification delivery preferences across different channels. You need to write a Node.js script that authenticates as a specific user and fetches their current channel delivery preferences using the MagicBell UserClient.

## Requirements
- Create a Node.js script that generates a User JWT for a specific user.
- The user's email must be constructed using the `MAGICBELL_EMAIL` environment variable and the current `run-id` in the format: `${MAGICBELL_EMAIL}+${run-id}@gmail.com`.
- Use the generated User JWT to initialize the MagicBell Node.js UserClient (`magicbell-js/user-client`).
- Fetch the user's channel delivery preferences.
- Write the fetched preferences data as a JSON string to a log file.

## Implementation Hints
1. Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
2. Read `MAGICBELL_EMAIL`, `MAGICBELL_API_KEY`, and `MAGICBELL_SECRET_KEY` from the environment.
3. Generate a User JWT signed with the `HS256` algorithm using the `jsonwebtoken` package. The payload should include `user_email` (set to the constructed email) and `api_key`.
4. Initialize the `Client` from `magicbell-js/user-client` with the generated token.
5. Call the appropriate method on `client.channels` to fetch the user preferences.
6. Write the resulting data object to `output.log` using `fs.writeFileSync`.

## Acceptance Criteria
- Project path: /home/user/magicbell-nodejs-fetch-preferences
- Command: node index.js
- The script must read `ZEALT_RUN_ID` to determine the `run-id`.
- The script must fetch preferences for the user email `${MAGICBELL_EMAIL}+${run-id}@gmail.com`.
- The script must output the fetched preferences to `/home/user/magicbell-nodejs-fetch-preferences/output.log`.
- The log file must contain a valid JSON object representing the user preferences (which typically includes a `categories` array).

