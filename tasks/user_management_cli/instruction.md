# MagicBell User Management with MagicBell CLI

## Background
You have the MagicBell CLI available in the environment. Your goal is to authenticate the CLI and manage a user within your MagicBell project.

## Requirements
- Authenticate the MagicBell CLI non-interactively using manual keys provided in the environment.
- Create or update a user in your MagicBell project.
- The user's external ID must be `user-${run-id}` and the email must be `user-${run-id}@example.com`, where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- The user should have the first name `John-${run-id}`, last name `Doe-${run-id}`, and custom attributes including `{"role": "admin", "run_id": "${run-id}"}`.
- Save the CLI output or verification log with the user's details to the designated log file.

## Implementation Hints
- Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
- Login non-interactively using the `--manual` flag and the environment variables: `MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, and `MAGICBELL_SECRET_KEY`.
- Use `magicbell user save` to upsert the user with the required JSON payload.
- Use `magicbell user list` to verify the user is listed in the project.
- Write the resulting user email to `/home/user/myproject/output.log`.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the real user creation/update action is executed and the log artifact exists.
- Log file: /home/user/myproject/output.log
- Use MagicBell CLI for user creation and listing.
- The user's external ID must be `user-${run-id}` where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- The user's email must be `user-${run-id}@example.com`.
- The log file must contain the created/updated user email in the format: `User Email: <user_email>`.

