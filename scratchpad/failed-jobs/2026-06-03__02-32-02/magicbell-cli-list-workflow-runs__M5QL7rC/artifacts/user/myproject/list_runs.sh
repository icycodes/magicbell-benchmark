#!/usr/bin/env bash

set -euo pipefail

WORKFLOW_KEY="${1:?Usage: $0 <workflow_key>}"

# Install magicbell-cli globally if not already installed
if ! command -v magicbell &>/dev/null; then
  npm install -g magicbell-cli
fi

# Authenticate non-interactively using environment variables
magicbell login --manual \
  --email "${MAGICBELL_EMAIL}" \
  --project-token "${MAGICBELL_PROJECT_TOKEN}" \
  --api-key "${MAGICBELL_API_KEY}" \
  --secret-key "${MAGICBELL_SECRET_KEY}"

# List workflow runs for the given workflow key
magicbell workflow list_runs --workflow_key "${WORKFLOW_KEY}"
