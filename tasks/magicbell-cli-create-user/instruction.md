# Create a User with MagicBell CLI

## Background
You have the MagicBell CLI available. Create a new user with a specific `external_id` and email using the CLI.

## Requirements
- Write a script to create a new user in MagicBell using the `magicbell-cli`.
- The user's `external_id` must be `user-${run-id}`.
- The user's `email` must be constructed using the `MAGICBELL_EMAIL` environment variable in the plus format: `[MAGICBELL_EMAIL_PREFIX]+${run-id}@gmail.com`. For example, if `MAGICBELL_EMAIL` is `mytest@gmail.com` or `mytest`, the email should be `mytest+${run-id}@gmail.com`.
- The user's `first_name` should be `TestUser` and `last_name` should be `${run-id}`.
- Save the created user's internal ID to a log file.

## Implementation Hints
1. Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
2. Parse the `MAGICBELL_EMAIL` environment variable to extract the username prefix, then append `+${run-id}@gmail.com`.
3. Use the `magicbell user save` command with the `--data` flag to create the user.
4. Remember to pass the authentication flags (`--email`, `--jwt`, `--api-key`, `--secret-key`) to the CLI command using the provided environment variables.
5. Extract the returned user ID and write it to the output log file.

## Acceptance Criteria
- Project path: `/home/user/myproject`
- Ensure the real user creation action is executed and the log artifact exists.
- Log file: `/home/user/myproject/output.log`
- The log file must contain the created user's ID in the format: `User ID: <user_id>`.

