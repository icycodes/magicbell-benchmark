# Create a User with Language Preference using MagicBell Go SDK

## Background
MagicBell allows you to store custom attributes for users, which can be useful for localization or personalization. In this task, you will write a Go script to create a user with a specific language preference using the official MagicBell Go SDK.

## Requirements
- Write a Go script that initializes the MagicBell Project Client.
- Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
- Read the base email from the `MAGICBELL_EMAIL` environment variable.
- Create a user with the following properties:
  - `ExternalId`: `user-${run-id}`
  - `Email`: `${MAGICBELL_EMAIL}+${run-id}@gmail.com`
  - `CustomAttributes`: Must include a `language` key set to `es`.
- Write the created user's ID to a log file.

## Implementation Hints
- Use the `github.com/magicbell/magicbell-go` SDK.
- Initialize the project client using your `MAGICBELL_PROJECT_TOKEN`.
- Use the `users.SaveUser` or similar method in the SDK to create or update the user.
- Set the custom attributes map on the user request object to include the language preference.
- Write the resulting user ID to `/home/user/magicbell-go-create-user-language/output.log`.

## Acceptance Criteria
- Project path: /home/user/magicbell-go-create-user-language
- Ensure the Go script is executed and the artifacts exist.
- Log file: /home/user/magicbell-go-create-user-language/output.log
- The user's `ExternalId` must be `user-${run-id}`.
- The user's `Email` must be `${MAGICBELL_EMAIL}+${run-id}@gmail.com`.
- The user must have a custom attribute `language` set to `es`.
- The log file must contain the created user's ID in the format: `User ID: <user_id>`.

