#!/bin/bash
set -euo pipefail

# Check that the required environment variables are set
if [ -z "${MAGICBELL_EMAIL:-}" ]; then
  echo "Error: MAGICBELL_EMAIL environment variable is not set." >&2
  exit 1
fi

if [ -z "${MAGICBELL_PROJECT_TOKEN:-}" ]; then
  echo "Error: MAGICBELL_PROJECT_TOKEN environment variable is not set." >&2
  exit 1
fi

if [ -z "${MAGICBELL_API_KEY:-}" ]; then
  echo "Error: MAGICBELL_API_KEY environment variable is not set." >&2
  exit 1
fi

if [ -z "${MAGICBELL_SECRET_KEY:-}" ]; then
  echo "Error: MAGICBELL_SECRET_KEY environment variable is not set." >&2
  exit 1
fi

if [ -z "${ZEALT_RUN_ID:-}" ]; then
  echo "Error: ZEALT_RUN_ID environment variable is not set." >&2
  exit 1
fi

# 1. Authenticate with MagicBell CLI non-interactively
echo "Authenticating with MagicBell CLI..."
magicbell login --manual \
  --email "$MAGICBELL_EMAIL" \
  --jwt "$MAGICBELL_PROJECT_TOKEN" \
  --api-key "$MAGICBELL_API_KEY" \
  --secret-key "$MAGICBELL_SECRET_KEY"

# 2. Derive the recipient email
local_part="${MAGICBELL_EMAIL%%@*}"
domain_part="${MAGICBELL_EMAIL##*@}"
recipient_email="${local_part}+cli-broadcast-${ZEALT_RUN_ID}@${domain_part}"
echo "Recipient email: $recipient_email"

# 3. Create the broadcast payload
payload=$(cat <<EOF
{
  "title": "CLI Broadcast Test",
  "content": "This is a test broadcast from the CLI.",
  "recipients": [
    {
      "email": "$recipient_email"
    }
  ]
}
EOF
)

# 4. Create the broadcast
echo "Creating broadcast..."
output=$(magicbell broadcast create --data "$payload")

# 5. Parse the broadcast ID from the output
broadcast_id=$(echo "$output" | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    try:
        data = json.loads(line)
        if 'id' in data:
            print(data['id'])
            break
    except Exception:
        pass
")

if [ -z "$broadcast_id" ]; then
  echo "Error: Failed to parse broadcast ID from output." >&2
  echo "Output was:" >&2
  echo "$output" >&2
  exit 1
fi

echo "Broadcast created successfully with ID: $broadcast_id"

# 6. Save the broadcast ID to the log file
log_file="/home/user/myproject/output.log"
echo "Broadcast ID: $broadcast_id" > "$log_file"
echo "Saved broadcast ID to $log_file"
