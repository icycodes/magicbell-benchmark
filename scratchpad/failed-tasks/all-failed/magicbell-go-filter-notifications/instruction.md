# Filter Notifications with MagicBell Go SDK

## Background
MagicBell allows users to manage their notifications. You need to write a Go script that authenticates as a specific user and retrieves their notifications, separating them into read and unread categories.

## Requirements
- Write a Go program that retrieves notifications for a specific user.
- The user's email must be constructed using the `MAGICBELL_EMAIL` environment variable and the `ZEALT_RUN_ID` environment variable in the format: `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`.
- Generate a User JWT for this user using `MAGICBELL_API_KEY` and `MAGICBELL_SECRET_KEY`.
- Use the `UserClient` from the official `github.com/magicbell/magicbell-go` SDK to list the user's notifications.
- Count the number of read and unread notifications.
- Write the results to a log file.

## Implementation Hints
1. Read the necessary environment variables (`MAGICBELL_EMAIL`, `ZEALT_RUN_ID`, `MAGICBELL_API_KEY`, `MAGICBELL_SECRET_KEY`).
2. Construct the target user email.
3. Create a User JWT signed with the `HS256` algorithm. The payload should include `user_email` and `api_key`.
4. Initialize the MagicBell Go SDK `UserClient` with the generated User JWT.
5. Fetch the notifications using the `UserClient`.
6. Iterate through the notifications, checking their read status to count read and unread ones.
7. Write the output to `/home/user/magicbell-task/output.log`.

## Acceptance Criteria
- Project path: `/home/user/magicbell-task`
- Ensure the script is executed and the artifact exists.
- Log file: `/home/user/magicbell-task/output.log`
- The Go script must use `github.com/magicbell/magicbell-go/pkg/user-client` to fetch notifications.
- The target user email must be exactly `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`.
- The log file must contain the counts of read and unread notifications in the following format:
  ```
  Read: <count>
  Unread: <count>
  ```

