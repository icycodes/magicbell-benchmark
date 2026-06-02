#!/bin/bash
set -e

# Extract local and domain from MAGICBELL_EMAIL
LOCAL=$(echo "$MAGICBELL_EMAIL" | cut -d'@' -f1)
DOMAIN=$(echo "$MAGICBELL_EMAIL" | cut -d'@' -f2)

EMAIL1="${LOCAL}+topic-subs-cli-1-${ZEALT_RUN_ID}@${DOMAIN}"
EMAIL2="${LOCAL}+topic-subs-cli-2-${ZEALT_RUN_ID}@${DOMAIN}"
EXT_ID1="user-topic-subs-cli-1-${ZEALT_RUN_ID}"
EXT_ID2="user-topic-subs-cli-2-${ZEALT_RUN_ID}"

# Login
magicbell login --manual --email "$MAGICBELL_EMAIL" --jwt "$MAGICBELL_PROJECT_TOKEN" --api-key "$MAGICBELL_API_KEY" --secret-key "$MAGICBELL_SECRET_KEY" >/dev/null 2>&1

# Upsert users
magicbell user save --data '{"external_id": "'"$EXT_ID1"'", "email": "'"$EMAIL1"'", "first_name": "TopicSubsCli", "last_name": "One-'"$ZEALT_RUN_ID"'"}' >/dev/null 2>&1
magicbell user save --data '{"external_id": "'"$EXT_ID2"'", "email": "'"$EMAIL2"'", "first_name": "TopicSubsCli", "last_name": "Two-'"$ZEALT_RUN_ID"'"}' >/dev/null 2>&1

# Generate HMACs
HMAC1=$(node -e "
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', process.env.MAGICBELL_SECRET_KEY);
hmac.update('$EXT_ID1');
console.log(hmac.digest('base64'));
")

HMAC2=$(node -e "
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', process.env.MAGICBELL_SECRET_KEY);
hmac.update('$EXT_ID2');
console.log(hmac.digest('base64'));
")

# Subscribe users to topic
curl -s -X POST https://api.magicbell.com/subscriptions \
  -H "X-MAGICBELL-API-KEY: ${MAGICBELL_API_KEY}" \
  -H "X-MAGICBELL-USER-EXTERNAL-ID: ${EXT_ID1}" \
  -H "X-MAGICBELL-USER-HMAC: ${HMAC1}" \
  -H "Content-Type: application/json" \
  -d '{"subscription":{"topic":"topic-cli-'"${ZEALT_RUN_ID}"'","categories":[{"slug":"*"}]}}' >/dev/null

curl -s -X POST https://api.magicbell.com/subscriptions \
  -H "X-MAGICBELL-API-KEY: ${MAGICBELL_API_KEY}" \
  -H "X-MAGICBELL-USER-EXTERNAL-ID: ${EXT_ID2}" \
  -H "X-MAGICBELL-USER-HMAC: ${HMAC2}" \
  -H "Content-Type: application/json" \
  -d '{"subscription":{"topic":"topic-cli-'"${ZEALT_RUN_ID}"'","categories":[{"slug":"*"}]}}' >/dev/null

# Create broadcast and capture output
BROADCAST_JSON=$(magicbell broadcast create --data '{
  "title": "Topic Subs CLI - '"$ZEALT_RUN_ID"'",
  "content": "A short description string.",
  "topic": "topic-cli-'"$ZEALT_RUN_ID"'",
  "recipients": [{"topic": {"subscribers": true}}]
}' 2>/dev/null)

BROADCAST_ID=$(echo "$BROADCAST_JSON" | jq -r 'select(.id != null) | .id')

echo "Broadcast ID: $BROADCAST_ID" > /home/user/magicbell-task/output.log

