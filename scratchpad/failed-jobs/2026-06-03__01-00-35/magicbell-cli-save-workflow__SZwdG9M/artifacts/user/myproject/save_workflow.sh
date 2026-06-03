#!/bin/bash

# Exit on error
set -e

# Read and validate environment variables
if [ -z "$ZEALT_RUN_ID" ]; then
  echo "Error: ZEALT_RUN_ID is not set" >&2
  exit 1
fi

if [ -z "$MAGICBELL_EMAIL" ]; then
  echo "Error: MAGICBELL_EMAIL is not set" >&2
  exit 1
fi

# Parse MAGICBELL_EMAIL to construct recipient email
local_part="${MAGICBELL_EMAIL%%@*}"
domain_part="${MAGICBELL_EMAIL#*@}"
recipient_email="${local_part}+cli-workflow-${ZEALT_RUN_ID}@${domain_part}"

# Construct workflow key
workflow_key="onboarding-campaign-${ZEALT_RUN_ID}"

# Perform manual login if credentials are provided in the environment
if [ -n "$MAGICBELL_PROJECT_TOKEN" ] && [ -n "$MAGICBELL_API_KEY" ] && [ -n "$MAGICBELL_SECRET_KEY" ]; then
  echo "Authenticating MagicBell CLI..."
  magicbell login --manual \
    --email "$MAGICBELL_EMAIL" \
    --jwt "$MAGICBELL_PROJECT_TOKEN" \
    --api-key "$MAGICBELL_API_KEY" \
    --secret-key "$MAGICBELL_SECRET_KEY"
fi

# Construct JSON payload using python to ensure safe and valid JSON formatting
json_payload=$(python3 -c "
import json
data = {
    'key': '$workflow_key',
    'steps': [
        {
            'command': 'broadcast',
            'input': {
                'title': 'Welcome to onboarding campaign!',
                'content': 'We are excited to have you on board.',
                'recipients': [
                    {
                        'email': '$recipient_email'
                    }
                ]
            }
        }
    ]
}
print(json.dumps(data))
")

echo "Saving workflow with key: $workflow_key"
echo "Recipient email: $recipient_email"

# Run magicbell workflow save command
magicbell workflow save --data "$json_payload"
