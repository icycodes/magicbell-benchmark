#!/usr/bin/env bash

set -euo pipefail

# Install MagicBell CLI globally
npm install -g magicbell-cli

# Authenticate non-interactively using environment variables
magicbell login --manual \
  --email "$MAGICBELL_EMAIL" \
  --project-token "$MAGICBELL_PROJECT_TOKEN" \
  --api-key "$MAGICBELL_API_KEY" \
  --secret-key "$MAGICBELL_SECRET_KEY"

# List runs for the specified workflow key
magicbell workflow list_runs --workflow_key "$1"