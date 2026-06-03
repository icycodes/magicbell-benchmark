#!/bin/bash

# Parse MAGICBELL_EMAIL prefix
EMAIL_PREFIX="${MAGICBELL_EMAIL%@*}"
USER_EMAIL="${EMAIL_PREFIX}+${ZEALT_RUN_ID}@gmail.com"

# Create JSON data
JSON_DATA=$(cat <<EOF
{
  "external_id": "user-${ZEALT_RUN_ID}",
  "email": "${USER_EMAIL}",
  "first_name": "TestUser",
  "last_name": "${ZEALT_RUN_ID}"
}
EOF
)

# Login
magicbell login --manual --email "$MAGICBELL_EMAIL" --jwt "$MAGICBELL_PROJECT_TOKEN" --api-key "$MAGICBELL_API_KEY" --secret-key "$MAGICBELL_SECRET_KEY" > /dev/null

# Save user and extract ID
OUTPUT=$(magicbell user save --data "$JSON_DATA")
USER_ID=$(echo "$OUTPUT" | tail -n 1 | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

# Write to log file
echo "User ID: $USER_ID" > /home/user/myproject/output.log
