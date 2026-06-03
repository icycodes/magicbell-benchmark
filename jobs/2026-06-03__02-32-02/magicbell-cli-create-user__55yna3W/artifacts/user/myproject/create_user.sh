#!/usr/bin/env bash
set -euo pipefail

# Read run ID
RUN_ID="${ZEALT_RUN_ID}"

# Parse email prefix (strip @... suffix if present)
EMAIL_PREFIX="${MAGICBELL_EMAIL%%@*}"

# Construct user fields
EXTERNAL_ID="user-${RUN_ID}"
USER_EMAIL="${EMAIL_PREFIX}+${RUN_ID}@gmail.com"
FIRST_NAME="TestUser"
LAST_NAME="${RUN_ID}"

echo "Creating MagicBell user:"
echo "  external_id : ${EXTERNAL_ID}"
echo "  email       : ${USER_EMAIL}"
echo "  first_name  : ${FIRST_NAME}"
echo "  last_name   : ${LAST_NAME}"

# Authenticate the CLI with provided credentials
magicbell login --manual \
  --email "${MAGICBELL_EMAIL}" \
  --jwt "${MAGICBELL_PROJECT_TOKEN}" \
  --api-key "${MAGICBELL_API_KEY}" \
  --secret-key "${MAGICBELL_SECRET_KEY}"

# Build JSON payload
DATA=$(printf '{"external_id":"%s","email":"%s","first_name":"%s","last_name":"%s"}' \
  "${EXTERNAL_ID}" "${USER_EMAIL}" "${FIRST_NAME}" "${LAST_NAME}")

# Call the MagicBell CLI to create/save the user
RESPONSE=$(magicbell user save --data "${DATA}" 2>&1)

echo "API response:"
echo "${RESPONSE}"

# Extract the internal user ID (UUID) from the JSON response
USER_ID=$(echo "${RESPONSE}" | grep -oP '"id"\s*:\s*"\K[^"]+' | head -1)

if [[ -z "${USER_ID}" ]]; then
  echo "ERROR: Could not extract user ID from response." >&2
  exit 1
fi

# Write the log file
LOG_FILE="/home/user/myproject/output.log"
echo "User ID: ${USER_ID}" > "${LOG_FILE}"
echo "Log written to ${LOG_FILE}: User ID: ${USER_ID}"
