# Verify Real-Time Email Delivery with MagicBell and Gmail API

## Background
MagicBell provides a powerful multi-channel notification delivery platform. In this task, you will implement a Node.js workflow that creates a user, sends a broadcast notification, and verifies that the notification is successfully delivered to the user's email address by querying the Gmail API.

## Requirements
- Create a Node.js project under `/home/user/magicbell-email-delivery`.
- Write a JavaScript script `send_and_verify.js` that:
  1. Retrieves the current run identifier from the `ZEALT_RUN_ID` environment variable.
  2. Generates a unique external ID and email address for the test user using the format:
     - External ID: `user_${ZEALT_RUN_ID}`
     - Email: `${GMAIL_USER_NAME}+${ZEALT_RUN_ID}@gmail.com` (where `GMAIL_USER_NAME` is read from the environment).
  3. Uses the `magicbell-js` SDK (`ProjectClient`) to create or update this user with the generated credentials.
  4. Sends a broadcast notification to this user with the following details:
     - Title: `Security Alert: Login from New Device [${ZEALT_RUN_ID}]`
     - Content: `A login was detected on your account. If this wasn't you, please change your password. Run ID: ${ZEALT_RUN_ID}`
  5. Uses the Gmail API (via `google-auth-library` and `googleapis` or direct HTTPS requests) with the credentials in `GMAIL_TOKEN_JSON` to poll the inbox for the delivered email.
  6. Once the email is found, prints the broadcast ID and the received email details (recipient and subject) to `/home/user/magicbell-email-delivery/output.log`.

## Implementation Hints
- Use the modern `@google-cloud/local-auth` or `google-auth-library` along with `googleapis` to authenticate and query Gmail messages.
- Use the `magicbell-js` SDK's `ProjectClient` initialized with `MAGICBELL_PROJECT_TOKEN` to manage users and broadcasts.
- When querying Gmail, poll the inbox at regular intervals (e.g., every 5 seconds) with a reasonable timeout (e.g., 90 seconds) to allow MagicBell to process and deliver the email.
- Filter Gmail messages using a query (e.g., `q`) to find messages matching the specific subject and recipient to avoid retrieving unrelated emails.

## Acceptance Criteria
- Project path: `/home/user/magicbell-email-delivery`
- Ensure the real broadcast and email delivery actions are executed and the log artifact exists.
- Log file: `/home/user/magicbell-email-delivery/output.log`
- The script must read `ZEALT_RUN_ID` and use it to isolate the user external ID (`user_${ZEALT_RUN_ID}`) and email (`${GMAIL_USER_NAME}+${ZEALT_RUN_ID}@gmail.com`).
- The script must print the following lines to `/home/user/magicbell-email-delivery/output.log`:
  - `Broadcast ID: <broadcast_id>`
  - `Email Received To: <to_email>`
  - `Email Received Subject: <subject>`

