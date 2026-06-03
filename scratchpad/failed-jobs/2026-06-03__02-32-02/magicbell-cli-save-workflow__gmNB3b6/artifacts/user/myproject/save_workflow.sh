#!/usr/bin/env bash
set -euo pipefail

# Read environment variables
RUN_ID="${ZEALT_RUN_ID}"
EMAIL="${MAGICBELL_EMAIL}"

# Construct the workflow key
WORKFLOW_KEY="onboarding-campaign-${RUN_ID}"

# Derive the recipient email by inserting +cli-workflow-${RUN_ID} into the local part
# e.g. user@example.com -> user+cli-workflow-<run-id>@example.com
LOCAL_PART="${EMAIL%@*}"
DOMAIN_PART="${EMAIL#*@}"
RECIPIENT="${LOCAL_PART}+cli-workflow-${RUN_ID}@${DOMAIN_PART}"

# Build the workflow JSON payload
PAYLOAD=$(cat <<EOF
{
  "key": "${WORKFLOW_KEY}",
  "steps": [
    {
      "command": "broadcast",
      "input": {
        "title": "Welcome to MagicBell!",
        "content": "Thank you for joining us. We're excited to have you on board.",
        "recipients": [
          { "email": "${RECIPIENT}" }
        ]
      }
    }
  ]
}
EOF
)

echo "Saving workflow: ${WORKFLOW_KEY}"
echo "Recipient: ${RECIPIENT}"

magicbell workflow save --data "${PAYLOAD}"

echo "Workflow saved successfully."
