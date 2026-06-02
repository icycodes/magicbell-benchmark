# Upsert a MagicBell User via MagicBell CLI

## Background
You need to provision an end user in your MagicBell project from a server-side script using the MagicBell CLI. The user must be created (or updated) with a stable `external_id`, a contact email derived from the project's account email, and a human-readable name. After the save completes, the resulting MagicBell user `id` (UUID) must be recorded in a log file so that downstream automation can reference the user.

## Requirements
- Authenticate the MagicBell CLI non-interactively using the credentials provided via environment variables.
- Upsert a single MagicBell user with the following attributes:
  - `external_id`: `user-${ZEALT_RUN_ID}`.
  - `email`: built from `MAGICBELL_EMAIL` using sub-addressing — if `MAGICBELL_EMAIL` is `<local>@<domain>`, the user email must be `<local>+save-user-cli-${ZEALT_RUN_ID}@<domain>`.
  - `first_name`: `Harbor`.
  - `last_name`: `Tester`.
- Parse the CLI's JSON output, extract the returned MagicBell user `id`, and write a single line to the log file.

## Implementation Hints
- Read `ZEALT_RUN_ID` and `MAGICBELL_EMAIL` from the environment, and derive the recipient email by inserting `+save-user-cli-${ZEALT_RUN_ID}` before the `@` of `MAGICBELL_EMAIL`.
- Authenticate the CLI non-interactively with `magicbell login --manual`, passing `MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, and `MAGICBELL_SECRET_KEY`.
- Use `magicbell user save --data '<json>'` to upsert the user; the CLI prints the saved user as JSON containing the assigned `id`.
- Tools like `jq` are available; use them (or a small Node/Python helper) to extract the `id` field from the CLI output.
- Save the result line to `/home/user/magicbell-task/output.log`.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Ensure the real user save action is executed against MagicBell and the log artifact exists.
- Log file: /home/user/magicbell-task/output.log
- Use the MagicBell CLI (`magicbell user save`) to upsert the user.
- The user's `external_id` must be `user-${ZEALT_RUN_ID}` where `ZEALT_RUN_ID` is read from the environment.
- The user's `email` must be `<local>+save-user-cli-${ZEALT_RUN_ID}@<domain>` where `<local>` and `<domain>` come from splitting `MAGICBELL_EMAIL` at the `@` character.
- The log file must contain the MagicBell user ID in the format: `User ID: <id>` where `<id>` is the UUID assigned by MagicBell.

