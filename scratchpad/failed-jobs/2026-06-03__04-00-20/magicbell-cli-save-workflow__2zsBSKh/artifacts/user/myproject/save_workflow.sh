#!/usr/bin/env bash
set -euo pipefail

# Read the run ID from environment variable
RUN_ID="${ZEALT_RUN_ID}"

# Parse MAGICBELL_EMAIL to construct the recipient email
# Format: user@example.com -> user+cli-workflow-${run-id}@example.com
ORIGINAL_EMAIL="${MAGICBELL_EMAIL}"
LOCAL_PART="${ORIGINAL_EMAIL%%@*}"
DOMAIN_PART="${ORIGINAL_EMAIL#*@}"
RECIPIENT_EMAIL="${LOCAL_PART}+cli-workflow-${RUN_ID}@${DOMAIN_PART}"

# Define the workflow key
WORKFLOW_KEY="onboarding-campaign-${RUN_ID}"

# Save the workflow using the MagicBell CLI
magicbell workflow save --data "$(cat <<EOF
{
  "key": "${WORKFLOW_KEY}",
  "steps": [
    {
      "command": "broadcast",
      "input": {
        "title": "Welcome to Onboarding",
        "content": "We're excited to have you on board! Let's get started with your journey.",
        "recipients": [
          {
            "email": "${RECIPIENT_EMAIL}"
          }
        ]
      }
    }
  ]
}
EOF
)"