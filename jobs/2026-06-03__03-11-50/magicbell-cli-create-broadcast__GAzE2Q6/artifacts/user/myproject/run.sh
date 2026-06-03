#!/bin/bash

LOCAL="${MAGICBELL_EMAIL%@*}"
DOMAIN="${MAGICBELL_EMAIL#*@}"
RECIPIENT="${LOCAL}+cli-broadcast-${ZEALT_RUN_ID}@${DOMAIN}"

# Login
magicbell login --manual \
  --email "$MAGICBELL_EMAIL" \
  --jwt "$MAGICBELL_PROJECT_TOKEN" \
  --api-key "$MAGICBELL_API_KEY" \
  --secret-key "$MAGICBELL_SECRET_KEY" > /dev/null 2>&1

# Create broadcast
JSON_DATA=$(cat <<INNER_EOF
{
  "title": "CLI Broadcast Test",
  "content": "This is a test broadcast from the CLI.",
  "recipients": [
    {
      "email": "$RECIPIENT"
    }
  ]
}
INNER_EOF
)

# Run create broadcast and redirect stderr to /dev/null to hide the debug log
OUTPUT=$(magicbell broadcast create --data "$JSON_DATA" 2>/dev/null)

# Extract ID using jq (or grep if jq is not available)
if command -v jq >/dev/null 2>&1; then
  BROADCAST_ID=$(echo "$OUTPUT" | jq -r '.id')
else
  BROADCAST_ID=$(echo "$OUTPUT" | grep -oP '"id":"\K[^"]+')
fi

echo "Broadcast ID: $BROADCAST_ID" > /home/user/myproject/output.log
