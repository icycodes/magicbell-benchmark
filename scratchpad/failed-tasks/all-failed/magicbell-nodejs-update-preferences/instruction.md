# Update User Notification Preferences

## Background
MagicBell allows users to customize their notification delivery preferences (e.g., turning off emails for specific categories). You need to write a Node.js script that updates a specific user's notification preferences using the `magicbell-js` UserClient.

## Requirements
- Write a Node.js script `update_preferences.js` that disables the `email` channel for the `default` category for a specific user.
- The user's email must be dynamically constructed as `${MAGICBELL_EMAIL}+${runId}@gmail.com`, where `runId` is read from the `ZEALT_RUN_ID` environment variable.
- The script must generate a valid User JWT to authenticate the `magicbell-js` UserClient.
- Execute the script to apply the preference updates.

## Implementation Hints
1. Read `ZEALT_RUN_ID`, `MAGICBELL_EMAIL`, `MAGICBELL_API_KEY`, and `MAGICBELL_SECRET_KEY` from the environment.
2. Generate a User JWT using the `jsonwebtoken` library (signed with `HS256`).
3. Initialize the `Client` from `magicbell-js/user-client` using the generated token.
4. Call the appropriate method on `client.channels` to save the user preferences, setting `enabled: false` for the `email` channel under the `default` category.
5. Print a success message to a log file upon completion.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the script is executed and the artifacts exist.
- Log file: /home/user/myproject/output.log
- The script must successfully update the user's preferences to disable the `email` channel for the `default` category.
- In the log file, print a success message (e.g., `Preferences updated.`).
