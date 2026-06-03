#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Make sure the workflow key is provided
if [ -z "$1" ]; then
  echo "Error: workflow key is required." >&2
  echo "Usage: bash list_runs.sh <workflow_key>" >&2
  exit 1
fi

WORKFLOW_KEY="$1"

# Authenticate the MagicBell CLI non-interactively
# Redirect stdout of login to stderr to keep stdout clean for the workflow runs output
magicbell login \
  --manual \
  --email "$MAGICBELL_EMAIL" \
  --jwt "$MAGICBELL_PROJECT_TOKEN" \
  --api-key "$MAGICBELL_API_KEY" \
  --secret-key "$MAGICBELL_SECRET_KEY" >&2

# Fetch and output the raw workflow runs to stdout
magicbell workflow list_runs --workflow_key "$WORKFLOW_KEY"
