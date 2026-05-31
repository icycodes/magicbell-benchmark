# MagicBell CLI Notification and Email Delivery Verification

## Background
MagicBell provides a CLI that allows you to manage users, workflows, and broadcasts. In this task, you will use the MagicBell CLI to non-interactively authenticate, create a user, and broadcast a notification. You will then verify that the notification was delivered via email using Gmail.

## Requirements
- Authenticate non-interactively with the MagicBell CLI using the manual login option.
- Create or update a user in MagicBell. The user's external ID must be `user-${ZEALT_RUN_ID}` and the email must be `${GMAIL_USER_NAME}+${ZEALT_RUN_ID}@gmail.com`.
- Broadcast a notification to this user. The title of the broadcast must be `Broadcast to ${ZEALT_RUN_ID}` and the content must be `This is a test notification for run ${ZEALT_RUN_ID}.`.
- Verify that the notification was successfully sent and received by checking the recipient's inbox using the Gmail API.
- Save the results of your operations to a log file.

## Implementation Hints
- Read the current run ID from the `ZEALT_RUN_ID` environment variable.
- Read the Gmail username from the `GMAIL_USER_NAME` environment variable.
- To log in to the MagicBell CLI non-interactively, use the `magicbell login` command with the `--manual` flag and the required authentication parameters from the environment.
- To create the user, use `magicbell user save` with the appropriate JSON data payload.
- To send the broadcast, use `magicbell broadcast create` with the appropriate JSON data payload.
- Write a script (e.g., in Python or JS) using the Gmail API credentials from `GMAIL_TOKEN_JSON` to search the inbox for the email with the subject `Broadcast to ${ZEALT_RUN_ID}` and confirm its delivery.
- Log the results of each step to the output log file.

## Acceptance Criteria
- Project path: /home/user/magicbell-cli-task
- Ensure the real user creation and broadcast actions are executed and the log artifact exists.
- Log file: /home/user/magicbell-cli-task/output.log
- The user's external ID must be `user-${ZEALT_RUN_ID}` and the email must be `${GMAIL_USER_NAME}+${ZEALT_RUN_ID}@gmail.com` where `ZEALT_RUN_ID` is read from the `ZEALT_RUN_ID` environment variable and `GMAIL_USER_NAME` is read from the `GMAIL_USER_NAME` environment variable.
- The broadcast notification must have the title `Broadcast to ${ZEALT_RUN_ID}` and recipient external ID `user-${ZEALT_RUN_ID}`.
- The log file must contain the following information:
  - The created user's external ID in the format: `User External ID: <external_id>`
  - The broadcast ID in the format: `Broadcast ID: <broadcast_id>`
  - The verified email subject in the format: `Email Subject: <subject>`

