# Manage User Notification Preferences with MagicBell CLI

## Background
MagicBell provides a powerful multi-channel notification platform where users can configure their own notification preferences (e.g., enabling or disabling specific delivery channels like email or mobile push for different notification categories).

In this task, you will use the MagicBell CLI to manage a user's notification preferences. You will create a test user, configure the CLI to act as that user, disable email notifications for a specific category, and verify the changes by fetching and logging the user's updated preferences.

## Requirements
- Log into the MagicBell CLI non-interactively using the manual login option with your project's administrative credentials.
- Determine the unique `run-id` from the `ZEALT_RUN_ID` environment variable.
- Create or update a test user with:
  - External ID: `user-${run-id}`
  - Email: `${GMAIL_USER_NAME}+user-${run-id}@gmail.com`
- Configure the MagicBell CLI's user context to act as this newly created user.
- Update the user's notification preferences to disable the `email` channel for the `billing` category (or categories containing `billing`).
- Fetch the updated user notification preferences and save the resulting JSON output to the specified log file.

## Implementation Hints
1. Read the current `run-id` from the `ZEALT_RUN_ID` environment variable and construct the user's email using the `GMAIL_USER_NAME` environment variable.
2. Use `magicbell login --manual` to authenticate the CLI non-interactively using the project and API keys from the environment.
3. Create/save the user using the `magicbell user save` command.
4. Configure the user context in the CLI using `magicbell config set` with the user's email, API key, and secret key so that subsequent user-scoped commands automatically authenticate and compute the HMAC signature.
5. Use the user-scoped notification-preferences commands (`magicbell user notification-preferences update` or `magicbell notification-preferences update`) to update the preferences.
6. Retrieve the updated preferences and write them to the log file.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the real preference update action is executed on MagicBell and the log artifact exists.
- Log file: /home/user/myproject/preferences.json
- Use MagicBell CLI for all operations.
- The test user's email must be `${GMAIL_USER_NAME}+user-${run-id}@gmail.com` where `run-id` is read from `ZEALT_RUN_ID` and `GMAIL_USER_NAME` is read from the environment.
- The test user's external ID must be `user-${run-id}`.
- The log file `/home/user/myproject/preferences.json` must contain the fetched user notification preferences JSON output showing that the `email` channel for the `billing` category is disabled (`"enabled": false`).

