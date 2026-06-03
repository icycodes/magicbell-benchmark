#!/bin/bash

set -e

# Configure MagicBell CLI credentials from environment variables
mkdir -p ~/.magicbell
cat > ~/.magicbell/config.json <<EOF
{
  "email": "${MAGICBELL_EMAIL}",
  "jwt": "${MAGICBELL_PROJECT_TOKEN}",
  "api_key": "${MAGICBELL_API_KEY}",
  "secret_key": "${MAGICBELL_SECRET_KEY}"
}
EOF

# Create a new user using MagicBell CLI
magicbell user save \
  --data "{\"external_id\": \"user-${ZEALT_RUN_ID}\", \"email\": \"${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com\"}"

# List all users and save output to users.txt
magicbell user list > users.txt
