# Delete a User with MagicBell Go SDK

## Background
We need to clean up a specific user account from our MagicBell project using the Go SDK.

## Requirements
- Write and execute a Go script that deletes a user by their email using the MagicBell Go SDK ProjectClient.
- The target user email must be constructed as `${MAGICBELL_EMAIL}+${run-id}@gmail.com`, where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- The script must successfully delete the user from MagicBell.
- Save the result to a log file.

## Implementation Hints
1. Initialize the MagicBell Go SDK ProjectClient using the `MAGICBELL_PROJECT_TOKEN` environment variable.
2. Read the `ZEALT_RUN_ID` environment variable to construct the target email: `${MAGICBELL_EMAIL}+${run-id}@gmail.com`.
3. Call the appropriate method on the `Users` service to delete the user. Note that in MagicBell, you can often reference a user by email using the format `email:the_email@example.com` as their ID.
4. Write a confirmation message to `/home/user/magicbell-go-delete-user/output.log`.

## Acceptance Criteria
- Project path: /home/user/magicbell-go-delete-user
- Ensure the real action is executed and the log artifact exists.
- Log file: /home/user/magicbell-go-delete-user/output.log
- The log file must contain the deleted user's email in the format: `User deleted: <email>`.
- The user must no longer exist in the MagicBell project.

