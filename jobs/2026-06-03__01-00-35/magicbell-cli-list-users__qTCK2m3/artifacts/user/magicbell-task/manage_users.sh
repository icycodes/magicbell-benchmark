#!/bin/bash

# Exit on error
set -e

# Login to MagicBell CLI using the environment variables
magicbell login --manual \
  --email "$MAGICBELL_EMAIL" \
  --jwt "$MAGICBELL_PROJECT_TOKEN" \
  --api-key "$MAGICBELL_API_KEY" \
  --secret-key "$MAGICBELL_SECRET_KEY"

# Construct external ID and email
EXTERNAL_ID="user-${ZEALT_RUN_ID}"
EMAIL="${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com"

# Create the new user
magicbell user save --data "{\"external_id\": \"${EXTERNAL_ID}\", \"email\": \"${EMAIL}\"}"

# List all users and save to users.txt
magicbell user list > users.txt
