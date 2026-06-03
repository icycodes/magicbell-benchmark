# Create a Broadcast Notification with MagicBell CLI

## Background
You have the MagicBell CLI available. Create a bash script that sends a broadcast notification to a specific email address and records the resulting broadcast ID in a log file.

## Requirements
- Write a bash script `run.sh` that uses the MagicBell CLI to create a broadcast notification.
- The broadcast title should be `CLI Broadcast Test` and the content should be `This is a test broadcast from the CLI.`.
- The broadcast must be sent to a single email recipient.
- The recipient email must be derived from the `MAGICBELL_EMAIL` environment variable. Split `MAGICBELL_EMAIL` at `@` into `<local>` and `<domain>`, and construct the recipient email as `<local>+cli-broadcast-${ZEALT_RUN_ID}@<domain>`, where `${ZEALT_RUN_ID}` is read from the environment.
- Execute the script to create the broadcast and save the broadcast ID to a log file.

## Implementation Hints
1. Read the `MAGICBELL_EMAIL` and `ZEALT_RUN_ID` environment variables to construct the recipient email.
2. Use the MagicBell CLI (`magicbell broadcast create`) to send the broadcast.
3. The CLI is already installed, but you must authenticate it non-interactively using the provided environment variables (`MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, `MAGICBELL_SECRET_KEY`) before creating the broadcast.
4. Parse the broadcast ID from the CLI output and write it to the log file.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the bash script is executed and the real broadcast creation action is performed.
- Log file: /home/user/myproject/output.log
- The log file must contain the broadcast ID in the format: `Broadcast ID: <broadcast_id>`.
- The broadcast must be successfully created in the MagicBell project and delivered to the correct recipient email.
