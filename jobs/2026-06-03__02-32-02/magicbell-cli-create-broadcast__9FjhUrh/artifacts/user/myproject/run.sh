#!/usr/bin/env bash
set -euo pipefail

# Read environment variables
: "${MAGICBELL_EMAIL:?MAGICBELL_EMAIL is required}"
: "${ZEALT_RUN_ID:?ZEALT_RUN_ID is required}"
: "${MAGICBELL_PROJECT_TOKEN:?MAGICBELL_PROJECT_TOKEN is required}"
: "${MAGICBELL_API_KEY:?MAGICBELL_API_KEY is required}"
: "${MAGICBELL_SECRET_KEY:?MAGICBELL_SECRET_KEY is required}"

# Construct recipient email: <local>+cli-broadcast-${ZEALT_RUN_ID}@<domain>
LOCAL="${MAGICBELL_EMAIL%%@*}"
DOMAIN="${MAGICBELL_EMAIL##*@}"
RECIPIENT="${LOCAL}+cli-broadcast-${ZEALT_RUN_ID}@${DOMAIN}"

echo "Recipient email: ${RECIPIENT}"

# Authenticate non-interactively
magicbell login \
  --manual \
  --email "${MAGICBELL_EMAIL}" \
  --jwt "${MAGICBELL_PROJECT_TOKEN}" \
  --api-key "${MAGICBELL_API_KEY}" \
  --secret-key "${MAGICBELL_SECRET_KEY}"

# Create the broadcast and capture output
OUTPUT=$(magicbell broadcast create --data "{
  \"title\": \"CLI Broadcast Test\",
  \"content\": \"This is a test broadcast from the CLI.\",
  \"recipients\": [
    {\"email\": \"${RECIPIENT}\"}
  ]
}")

echo "CLI output:"
echo "${OUTPUT}"

# Parse the broadcast ID from the output
BROADCAST_ID=$(echo "${OUTPUT}" | grep -oP '"id":\s*"\K[^"]+' | head -1)

if [ -z "${BROADCAST_ID}" ]; then
  echo "ERROR: Could not parse broadcast ID from output." >&2
  exit 1
fi

echo "Broadcast ID: ${BROADCAST_ID}"

# Write to log file
LOG_FILE="/home/user/myproject/output.log"
echo "Broadcast ID: ${BROADCAST_ID}" > "${LOG_FILE}"

echo "Log written to ${LOG_FILE}"
