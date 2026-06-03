# List Workflow Runs via MagicBell CLI

## Background
MagicBell workflows orchestrate multi-step notification campaigns. To monitor or debug these campaigns, you need to retrieve their execution history using the MagicBell CLI.

## Requirements
- Write a bash script `list_runs.sh` that lists the runs for a specific workflow key.
- The workflow key will be passed as the first argument to the script.
- The script must use the MagicBell CLI to fetch the runs.
- Ensure the CLI is authenticated non-interactively using the provided environment variables (`MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, `MAGICBELL_SECRET_KEY`).
- Output the raw result of the CLI command to stdout.

## Implementation Hints
- Install `magicbell-cli` globally via npm.
- Authenticate the CLI using `magicbell login --manual` with the provided environment variables.
- Use the `magicbell workflow list_runs` command, passing the workflow key via the `--workflow_key` flag.
- The workflow key is available as `$1` in the bash script.

## Acceptance Criteria
- Project path: /home/user/myproject
- Command: bash list_runs.sh <workflow_key>
- The stdout should print the CLI's output for the workflow runs.

