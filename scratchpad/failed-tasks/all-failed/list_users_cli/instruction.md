# List MagicBell Users via the CLI

## Background
You need to verify a recently provisioned user shows up in the MagicBell project roster. Use the MagicBell CLI to first upsert a recognizable user, then enumerate users in the project and capture identifying details for the newly created entry.

## Requirements
- Log in to MagicBell CLI non-interactively using the provided credentials.
- Upsert a user via the CLI whose `external_id` is `list-users-cli-${ZEALT_RUN_ID}` and whose email uses the sub-addressed Gmail format.
- Enumerate users with the MagicBell CLI and locate the row whose `external_id` exactly matches `list-users-cli-${ZEALT_RUN_ID}`.
- Write the located user's `id` and `external_id` to the task log file.

## Implementation Hints
- Read `run-id` from the `ZEALT_RUN_ID` environment variable and `GMAIL_USER_NAME` for the email prefix.
- Authenticate the CLI non-interactively with `magicbell login --manual` and the provided env credentials.
- Use `magicbell user save --data '{...}'` to upsert the user with the run-scoped `external_id`.
- Use `magicbell user list` to enumerate users. The result is paginated JSON; page through results as needed until the matching user is found.
- Parse the JSON output to extract the user's `id` and `external_id`, then write them to `/home/user/magicbell-task/output.log`.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Ensure the real user upsert and list actions are executed against MagicBell and the log artifact exists.
- Log file: /home/user/magicbell-task/output.log
- Use MagicBell CLI for both the upsert and the listing.
- The user's `external_id` must be `list-users-cli-${ZEALT_RUN_ID}` where `ZEALT_RUN_ID` is read from the environment.
- The user's `email` must be `${GMAIL_USER_NAME}+list-users-cli-${ZEALT_RUN_ID}@gmail.com`.
- The log file must contain two lines in the exact format:
  - `User ID: <id>`
  - `External ID: <external_id>`

