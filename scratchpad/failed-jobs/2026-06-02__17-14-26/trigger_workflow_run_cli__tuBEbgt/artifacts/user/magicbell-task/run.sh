#!/bin/bash
set -e

LOCAL_PART="${MAGICBELL_EMAIL%@*}"
DOMAIN_PART="${MAGICBELL_EMAIL#*@}"
RECIPIENT_EMAIL="${LOCAL_PART}+trigger-cli-${ZEALT_RUN_ID}@${DOMAIN_PART}"
WF_KEY="wf-trigger-cli-${ZEALT_RUN_ID}"
MARKER="trigger-cli-${ZEALT_RUN_ID}"

cat <<EOF > /home/user/magicbell-task/wf.json
{
  "key": "${WF_KEY}",
  "name": "CLI Trigger Workflow",
  "steps": [
    {
      "type": "broadcast",
      "action": "send_notification",
      "input": {
        "title": "Workflow Trigger CLI - {{ marker }}",
        "content": "This is a broadcast triggered from CLI",
        "recipients": [
          {
            "email": "{{ recipient_email }}"
          }
        ]
      }
    }
  ]
}
EOF

magicbell workflow save --data "$(< /home/user/magicbell-task/wf.json)"

cat <<EOF > /home/user/magicbell-task/run.json
{
  "key": "${WF_KEY}",
  "input": {
    "marker": "${MARKER}",
    "recipient_email": "${RECIPIENT_EMAIL}"
  }
}
EOF

RUN_OUTPUT=$(magicbell workflow create_run --data "$(< /home/user/magicbell-task/run.json)")
echo "$RUN_OUTPUT"
RUN_ID=$(echo "$RUN_OUTPUT" | jq -r '.data.id')

echo "Workflow Run ID: ${RUN_ID}" > /home/user/magicbell-task/output.log
