# Manage Users with MagicBell CLI

## Background
You need to manage users in your MagicBell project using the MagicBell CLI.

## Requirements
- Write a shell script `manage_users.sh` that uses the MagicBell CLI to perform two actions:
  1. Create a new user. The user's external ID must be `user-${ZEALT_RUN_ID}` and the email must be `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`, where `ZEALT_RUN_ID` and `MAGICBELL_EMAIL` are read from the environment.
  2. List all users in the project and save the output to a file named `users.txt` in the current directory.

## Implementation Hints
- The MagicBell CLI is already installed globally.
- You can assume that the CLI is already authenticated or that the required environment variables (`MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, `MAGICBELL_SECRET_KEY`) are available in the environment.
- Use the `magicbell user save` command to create the user.
- Use the `magicbell user list` command to retrieve the list of users and redirect the output to `users.txt`.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Command: bash manage_users.sh
- The command must execute successfully and create `users.txt`.
- The project must have a user with the external ID `user-${ZEALT_RUN_ID}` and email `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`.
- `users.txt` must contain the output of the user list command, which should include the newly created user.

