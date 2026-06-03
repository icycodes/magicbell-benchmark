#!/usr/bin/env bash
set -euo pipefail

# Authenticate with MagicBell CLI
magicbell login --manual \
  --email "$MAGICBELL_EMAIL" \
  --jwt "$MAGICBELL_PROJECT_TOKEN" \
  --api-key "$MAGICBELL_API_KEY" \
  --secret-key "$MAGICBELL_SECRET_KEY"

# Create a new user with external ID and email based on environment variables
magicbell user save --data "{\"external_id\":\"user-${ZEALT_RUN_ID}\",\"email\":\"${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com\"}"

# List all users and save output to users.txt
magicbell user list --limit 100 > users.txt