# Update User Custom Attributes using Node.js SDK

## Background
MagicBell allows you to store custom attributes for users, which can be useful for targeted broadcasts and personalized notifications. In this task, you will use the MagicBell Node.js SDK to create or update a user and set their custom attributes.

## Requirements
- Write a Node.js script that uses the `@magicbell/magicbell-js` or `magicbell-js` SDK (specifically the `ProjectClient`) to update a user's custom attributes.
- Use the provided `MAGICBELL_PROJECT_TOKEN` environment variable to authenticate the client.
- The user's email must be the value of the `MAGICBELL_EMAIL` environment variable with a `+${run-id}` suffix before the `@` symbol (e.g., if `MAGICBELL_EMAIL` is `test@gmail.com`, use `test+${run-id}@gmail.com`).
- The user's `externalId` must be `user-${run-id}`.
- Set the user's custom attributes to include `"plan": "premium"` and `"task": "user-attributes-${run-id}"`.
- The script should output the updated user's ID to a log file.

## Implementation Hints
- Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
- Parse the `MAGICBELL_EMAIL` environment variable to insert the `+${run-id}` part correctly.
- Use the `ProjectClient` from `magicbell-js/project-client` to call the `saveUser` method with the required data.
- Write the resulting user ID to `/home/user/magicbell-task/output.log`.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Ensure the real user update action is executed by running the script.
- Log file: /home/user/magicbell-task/output.log
- The log file must contain the user ID in the format: `User ID: <user_id>`.
- The user in MagicBell must have the specified email, `externalId`, and custom attributes.

