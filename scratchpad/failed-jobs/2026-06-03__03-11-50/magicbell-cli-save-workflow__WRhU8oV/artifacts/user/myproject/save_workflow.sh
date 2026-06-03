#!/bin/bash

# Login to MagicBell CLI
magicbell login --manual \
  --jwt "${MAGICBELL_PROJECT_TOKEN}" \
  --email "${MAGICBELL_EMAIL}" \
  --api-key "${MAGICBELL_API_KEY}" \
  --secret-key "${MAGICBELL_SECRET_KEY}"

# Extract run-id
RUN_ID="${ZEALT_RUN_ID}"

# Parse MAGICBELL_EMAIL
LOCAL_PART="${MAGICBELL_EMAIL%@*}"
DOMAIN_PART="${MAGICBELL_EMAIL#*@}"

# Construct recipient email
RECIPIENT="${LOCAL_PART}+cli-workflow-${RUN_ID}@${DOMAIN_PART}"

# Construct workflow JSON
WORKFLOW_KEY="onboarding-campaign-${RUN_ID}"

JSON_DATA=$(cat <<EOF
{
  "key": "${WORKFLOW_KEY}",
  "name": "Onboarding Campaign ${RUN_ID}",
  "steps": [
    {
      "command": "broadcast",
      "input": {
        "title": "Welcome!",
        "content": "Thanks for signing up.",
        "recipients": [
          {
            "email": "${RECIPIENT}"
          }
        ]
      }
    }
  ]
}
EOF
)

# Save workflow
magicbell workflow save --data="${JSON_DATA}"
