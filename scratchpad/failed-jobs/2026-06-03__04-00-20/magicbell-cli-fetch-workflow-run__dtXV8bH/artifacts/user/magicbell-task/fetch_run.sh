#!/bin/bash

# Authenticate with MagicBell CLI
magicbell login --manual \
  --email "$MAGICBELL_EMAIL" \
  --jwt "$MAGICBELL_PROJECT_TOKEN" \
  --api-key "$MAGICBELL_API_KEY" \
  --secret-key "$MAGICBELL_SECRET_KEY"

# Fetch workflow run details using the run ID provided as the first argument
magicbell workflow fetch_run --run_id "$1" > "/home/user/magicbell-task/run_details_${ZEALT_RUN_ID}.json"