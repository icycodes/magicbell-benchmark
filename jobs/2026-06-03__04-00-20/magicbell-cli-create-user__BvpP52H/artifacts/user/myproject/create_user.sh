#!/bin/bash
set -e

# Read the run ID
RUN_ID="${ZEALT_RUN_ID}"
if [ -z "$RUN_ID" ]; then
    echo "ERROR: ZEALT_RUN_ID environment variable is not set"
    exit 1
fi

# Parse MAGICBELL_EMAIL to extract the prefix (part before @ or the whole string)
MAGICBELL_EMAIL="${MAGICBELL_EMAIL}"
if [ -z "$MAGICBELL_EMAIL" ]; then
    echo "ERROR: MAGICBELL_EMAIL environment variable is not set"
    exit 1
fi

# Extract the prefix: if email contains @, take the part before @; otherwise use as-is
if [[ "$MAGICBELL_EMAIL" == *@* ]]; then
    EMAIL_PREFIX="${MAGICBELL_EMAIL%%@*}"
else
    EMAIL_PREFIX="$MAGICBELL_EMAIL"
fi

# Construct the plus-format email
USER_EMAIL="${EMAIL_PREFIX}+${RUN_ID}@gmail.com"

# Construct user attributes
USER_EXTERNAL_ID="user-${RUN_ID}"
USER_FIRST_NAME="TestUser"
USER_LAST_NAME="${RUN_ID}"

# Update the MagicBell CLI config with authentication credentials
CONFIG_DIR="$HOME/.magicbell"
mkdir -p "$CONFIG_DIR"
cat > "$CONFIG_DIR/config.json" << EOF
{
  "email": "",
  "jwt": "${MAGICBELL_PROJECT_TOKEN}",
  "api_key": "${MAGICBELL_API_KEY}",
  "secret_key": "${MAGICBELL_SECRET_KEY}"
}
EOF

# Create the user using magicbell-cli
RESPONSE=$(magicbell user save --data "{\"external_id\":\"${USER_EXTERNAL_ID}\",\"email\":\"${USER_EMAIL}\",\"first_name\":\"${USER_FIRST_NAME}\",\"last_name\":\"${USER_LAST_NAME}\"}" 2>&1)

# Extract the user ID from the response
# The response is a JSON object with an "id" field
USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
    echo "ERROR: Failed to extract user ID from response"
    echo "Response: $RESPONSE"
    exit 1
fi

# Write the user ID to the output log file
LOG_FILE="/home/user/myproject/output.log"
echo "User ID: ${USER_ID}" > "$LOG_FILE"

echo "User created successfully"
echo "External ID: ${USER_EXTERNAL_ID}"
echo "Email: ${USER_EMAIL}"
echo "User ID: ${USER_ID}"
echo "Log written to ${LOG_FILE}"