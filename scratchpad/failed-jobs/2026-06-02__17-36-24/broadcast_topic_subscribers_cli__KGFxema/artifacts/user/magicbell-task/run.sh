#!/usr/bin/env bash
set -euo pipefail

# ── Read environment variables ───────────────────────────────────────────────
: "${ZEALT_RUN_ID:?ZEALT_RUN_ID is required}"
: "${MAGICBELL_EMAIL:?MAGICBELL_EMAIL is required}"
: "${MAGICBELL_PROJECT_TOKEN:?MAGICBELL_PROJECT_TOKEN is required}"
: "${MAGICBELL_API_KEY:?MAGICBELL_API_KEY is required}"
: "${MAGICBELL_SECRET_KEY:?MAGICBELL_SECRET_KEY is required}"

# ── Derive sub-addressed emails ──────────────────────────────────────────────
LOCAL="${MAGICBELL_EMAIL%@*}"
DOMAIN="${MAGICBELL_EMAIL#*@}"

EMAIL1="${LOCAL}+topic-subs-cli-1-${ZEALT_RUN_ID}@${DOMAIN}"
EMAIL2="${LOCAL}+topic-subs-cli-2-${ZEALT_RUN_ID}@${DOMAIN}"

EXT_ID1="user-topic-subs-cli-1-${ZEALT_RUN_ID}"
EXT_ID2="user-topic-subs-cli-2-${ZEALT_RUN_ID}"
TOPIC_KEY="topic-cli-${ZEALT_RUN_ID}"

LOG_FILE="/home/user/magicbell-task/output.log"

echo "==> Run ID     : ${ZEALT_RUN_ID}"
echo "==> Topic key  : ${TOPIC_KEY}"
echo "==> Email 1    : ${EMAIL1}"
echo "==> Email 2    : ${EMAIL2}"

# ── Step 1: Authenticate CLI non-interactively ───────────────────────────────
echo ""
echo "==> Step 1: Authenticating MagicBell CLI..."
magicbell login --manual \
  --email      "${MAGICBELL_EMAIL}" \
  --jwt        "${MAGICBELL_PROJECT_TOKEN}" \
  --api-key    "${MAGICBELL_API_KEY}" \
  --secret-key "${MAGICBELL_SECRET_KEY}"
echo "    Auth complete."

# ── Step 2: Upsert User 1 ────────────────────────────────────────────────────
# NOTE: magicbell user save takes flat JSON (no "user" wrapper)
echo ""
echo "==> Step 2: Upserting User 1 (${EXT_ID1})..."
USER1_JSON=$(magicbell user save --data "{
  \"external_id\": \"${EXT_ID1}\",
  \"email\": \"${EMAIL1}\",
  \"first_name\": \"TopicSubsCli\",
  \"last_name\": \"One-${ZEALT_RUN_ID}\"
}")
echo "    User 1 response: ${USER1_JSON}"

# ── Step 3: Upsert User 2 ────────────────────────────────────────────────────
echo ""
echo "==> Step 3: Upserting User 2 (${EXT_ID2})..."
USER2_JSON=$(magicbell user save --data "{
  \"external_id\": \"${EXT_ID2}\",
  \"email\": \"${EMAIL2}\",
  \"first_name\": \"TopicSubsCli\",
  \"last_name\": \"Two-${ZEALT_RUN_ID}\"
}")
echo "    User 2 response: ${USER2_JSON}"

# ── Compute HMACs for user-context subscription calls ─────────────────────────
# MagicBell requires HMAC-SHA256(secret_key, external_id) for user-context requests
HMAC1=$(echo -n "${EXT_ID1}" | openssl dgst -sha256 -hmac "${MAGICBELL_SECRET_KEY}" -binary | base64)
HMAC2=$(echo -n "${EXT_ID2}" | openssl dgst -sha256 -hmac "${MAGICBELL_SECRET_KEY}" -binary | base64)

# ── Step 4: Subscribe User 1 to topic (via REST) ─────────────────────────────
echo ""
echo "==> Step 4: Subscribing User 1 (${EXT_ID1}) to topic ${TOPIC_KEY}..."
SUB1_RESP=$(curl -s -w "\n%{http_code}" -X POST \
  "https://api.magicbell.com/subscriptions" \
  -H "X-MAGICBELL-API-KEY: ${MAGICBELL_API_KEY}" \
  -H "X-MAGICBELL-USER-EXTERNAL-ID: ${EXT_ID1}" \
  -H "X-MAGICBELL-USER-HMAC: ${HMAC1}" \
  -H "Content-Type: application/json" \
  -d "{\"subscription\":{\"topic\":\"${TOPIC_KEY}\",\"categories\":[{\"slug\":\"*\"}]}}")
SUB1_BODY=$(echo "${SUB1_RESP}" | head -n -1)
SUB1_CODE=$(echo "${SUB1_RESP}" | tail -n 1)
echo "    HTTP ${SUB1_CODE}: ${SUB1_BODY}"
if [[ "${SUB1_CODE}" != "2"* ]]; then
  echo "ERROR: Failed to subscribe user 1 (HTTP ${SUB1_CODE})" >&2
  exit 1
fi

# ── Step 5: Subscribe User 2 to topic (via REST) ─────────────────────────────
echo ""
echo "==> Step 5: Subscribing User 2 (${EXT_ID2}) to topic ${TOPIC_KEY}..."
SUB2_RESP=$(curl -s -w "\n%{http_code}" -X POST \
  "https://api.magicbell.com/subscriptions" \
  -H "X-MAGICBELL-API-KEY: ${MAGICBELL_API_KEY}" \
  -H "X-MAGICBELL-USER-EXTERNAL-ID: ${EXT_ID2}" \
  -H "X-MAGICBELL-USER-HMAC: ${HMAC2}" \
  -H "Content-Type: application/json" \
  -d "{\"subscription\":{\"topic\":\"${TOPIC_KEY}\",\"categories\":[{\"slug\":\"*\"}]}}")
SUB2_BODY=$(echo "${SUB2_RESP}" | head -n -1)
SUB2_CODE=$(echo "${SUB2_RESP}" | tail -n 1)
echo "    HTTP ${SUB2_CODE}: ${SUB2_BODY}"
if [[ "${SUB2_CODE}" != "2"* ]]; then
  echo "ERROR: Failed to subscribe user 2 (HTTP ${SUB2_CODE})" >&2
  exit 1
fi

# ── Step 6: Verify both subscriptions ────────────────────────────────────────
echo ""
echo "==> Step 6: Verifying subscriptions..."
VSUB1=$(curl -s \
  "https://api.magicbell.com/subscriptions" \
  -H "X-MAGICBELL-API-KEY: ${MAGICBELL_API_KEY}" \
  -H "X-MAGICBELL-USER-EXTERNAL-ID: ${EXT_ID1}" \
  -H "X-MAGICBELL-USER-HMAC: ${HMAC1}")
echo "    User 1 subscriptions: ${VSUB1}"

VSUB2=$(curl -s \
  "https://api.magicbell.com/subscriptions" \
  -H "X-MAGICBELL-API-KEY: ${MAGICBELL_API_KEY}" \
  -H "X-MAGICBELL-USER-EXTERNAL-ID: ${EXT_ID2}" \
  -H "X-MAGICBELL-USER-HMAC: ${HMAC2}")
echo "    User 2 subscriptions: ${VSUB2}"

# ── Step 7: Create broadcast with topic-subscribers filter ───────────────────
echo ""
echo "==> Step 7: Creating broadcast targeting topic subscribers..."
# NOTE: magicbell broadcast create takes flat JSON (no "broadcast" wrapper)
BROADCAST_PAYLOAD="{
  \"title\": \"Topic Subs CLI - ${ZEALT_RUN_ID}\",
  \"content\": \"Broadcast to all subscribers of topic ${TOPIC_KEY}\",
  \"topic\": \"${TOPIC_KEY}\",
  \"recipients\": [
    {
      \"topic\": {
        \"subscribers\": true
      }
    }
  ]
}"

echo "    Payload: ${BROADCAST_PAYLOAD}"
BROADCAST_OUTPUT=$(magicbell broadcast create --data "${BROADCAST_PAYLOAD}")
echo "    Broadcast response: ${BROADCAST_OUTPUT}"

# ── Step 8: Extract broadcast ID and write log ────────────────────────────────
echo ""
echo "==> Step 8: Extracting broadcast ID..."

# Extract id from JSON - use jq if available, else grep
if command -v jq &>/dev/null; then
  BROADCAST_ID=$(echo "${BROADCAST_OUTPUT}" | jq -r '.broadcast.id // .id // empty' 2>/dev/null || true)
fi

# Fallback: grep for the id field
if [[ -z "${BROADCAST_ID:-}" ]]; then
  BROADCAST_ID=$(echo "${BROADCAST_OUTPUT}" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
fi

if [[ -z "${BROADCAST_ID:-}" ]]; then
  echo "ERROR: Could not extract broadcast ID from output: ${BROADCAST_OUTPUT}" >&2
  exit 1
fi

echo "    Broadcast ID: ${BROADCAST_ID}"
echo "Broadcast ID: ${BROADCAST_ID}" > "${LOG_FILE}"
echo ""
echo "==> Done. Log written to ${LOG_FILE}"
cat "${LOG_FILE}"
