#!/usr/bin/env bash
set -euo pipefail

# Authenticate MagicBell CLI non-interactively
magicbell login \
  --manual \
  --email "${MAGICBELL_EMAIL}" \
  --jwt "${MAGICBELL_PROJECT_TOKEN}" \
  --api-key "${MAGICBELL_API_KEY}" \
  --secret-key "${MAGICBELL_SECRET_KEY}"

# Construct recipient email from MAGICBELL_EMAIL and ZEALT_RUN_ID
local_part="${MAGICBELL_EMAIL%%@*}"
domain_part="${MAGICBELL_EMAIL#*@}"
recipient_email="${local_part}+cli-broadcast-${ZEALT_RUN_ID}@${domain_part}"

# Create the broadcast
output=$(magicbell broadcast create --data "{
  \"title\": \"CLI Broadcast Test\",
  \"content\": \"This is a test broadcast from the CLI.\",
  \"recipients\": [
    {
      \"email\": \"${recipient_email}\"
    }
  ]
}" 2>&1)

echo "CLI output:"
echo "$output"

# Parse the broadcast ID from the output
broadcast_id=$(echo "$output" | grep -oE '"id"\s*:\s*"[^"]+"' | head -1 | sed 's/"id"\s*:\s*"//;s/"//')

# Write the broadcast ID to the log file
echo "Broadcast ID: ${broadcast_id}" > /home/user/myproject/output.log

echo "Broadcast created successfully!"
cat /home/user/myproject/output.log