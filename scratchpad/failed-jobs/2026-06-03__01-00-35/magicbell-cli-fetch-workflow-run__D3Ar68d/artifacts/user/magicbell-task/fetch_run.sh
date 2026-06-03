#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# The script must accept the run ID as the first positional argument.
if [ -z "$1" ]; then
  echo "Usage: $0 <workflow_run_id>" >&2
  exit 1
fi

WORKFLOW_RUN_ID="$1"

# The script must read the run-id from the ZEALT_RUN_ID environment variable.
if [ -z "$ZEALT_RUN_ID" ]; then
  echo "Error: ZEALT_RUN_ID environment variable is not set." >&2
  exit 1
fi

RUN_ID="$ZEALT_RUN_ID"

# Ensure we authenticate the CLI first using:
# magicbell login --manual --email "$MAGICBELL_EMAIL" --jwt "$MAGICBELL_PROJECT_TOKEN" --api-key "$MAGICBELL_API_KEY" --secret-key "$MAGICBELL_SECRET_KEY"
magicbell login --manual \
  --email "$MAGICBELL_EMAIL" \
  --jwt "$MAGICBELL_PROJECT_TOKEN" \
  --api-key "$MAGICBELL_API_KEY" \
  --secret-key "$MAGICBELL_SECRET_KEY"

# Use the magicbell workflow fetch_run command with the appropriate flag for the run ID.
# Redirect the output of the CLI command to the run_details_${run-id}.json file.
magicbell workflow fetch_run --run_id "$WORKFLOW_RUN_ID" > "/home/user/magicbell-task/run_details_${RUN_ID}.json"

echo "Workflow run details saved to /home/user/magicbell-task/run_details_${RUN_ID}.json"
