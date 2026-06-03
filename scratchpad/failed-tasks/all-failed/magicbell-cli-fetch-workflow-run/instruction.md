# Fetch Workflow Run Details with MagicBell CLI

## Background
You need to retrieve the execution status and details of a specific MagicBell workflow run using the MagicBell CLI.

## Requirements
- Write a bash script named `fetch_run.sh` that takes a workflow run ID as its first argument.
- The script must use the MagicBell CLI to fetch the execution details for the provided run ID.
- The script must save the output of the CLI command to a file named `run_details_${run-id}.json`, where `${run-id}` is the value of the `ZEALT_RUN_ID` environment variable.

## Implementation Hints
- The workflow run ID will be provided as `$1` to your script.
- Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
- Ensure you authenticate the CLI first using: `magicbell login --manual --email "$MAGICBELL_EMAIL" --jwt "$MAGICBELL_PROJECT_TOKEN" --api-key "$MAGICBELL_API_KEY" --secret-key "$MAGICBELL_SECRET_KEY"`
- Use the `magicbell workflow fetch_run` command with the appropriate flag for the run ID.
- Redirect the output of the CLI command to the `run_details_${run-id}.json` file.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Command: bash fetch_run.sh <run_id>
- The script must accept the run ID as the first positional argument.
- The script must read the `run-id` from the `ZEALT_RUN_ID` environment variable.
- The script must create a file at `/home/user/magicbell-task/run_details_${run-id}.json` containing the JSON execution details output by the CLI.

