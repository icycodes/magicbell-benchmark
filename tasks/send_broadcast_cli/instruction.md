# Send Broadcast via MagicBell CLI

## Background
You need to send an urgent system notification to a user using the MagicBell CLI.

## Requirements
- Log in to MagicBell CLI non-interactively using the provided credentials.
- Send a notification broadcast to a single user with the email format `${GMAIL_USER_NAME}+${ZEALT_RUN_ID}@gmail.com`.
- The broadcast title must be `Maintenance Update - ${ZEALT_RUN_ID}` and the content must be `The system will undergo scheduled maintenance.`.
- Extract the broadcast ID from the CLI output and save it to the log file.

## Implementation Hints
- Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
- Read the user email prefix `GMAIL_USER_NAME` from the environment variable.
- Authenticate the CLI non-interactively with `--manual`, passing the required credentials (`MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, `MAGICBELL_SECRET_KEY`).
- Use `magicbell broadcast create` to trigger the notification, passing the data as JSON.
- Save the broadcast ID to the log file `/home/user/magicbell-task/output.log`.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Ensure the real broadcast creation action is executed and the log artifact exists.
- Log file: /home/user/magicbell-task/output.log
- Use MagicBell CLI for sending the broadcast.
- The recipient email must be `${GMAIL_USER_NAME}+${ZEALT_RUN_ID}@gmail.com` where `GMAIL_USER_NAME` is read from the environment and `ZEALT_RUN_ID` is the current run ID.
- The broadcast title must be `Maintenance Update - ${ZEALT_RUN_ID}`.
- The log file must contain the broadcast ID in the format: `Broadcast ID: <broadcast_id>`.

