#!/bin/bash
set -e

EXT_ID1="user-topic-subs-cli-1-${ZEALT_RUN_ID}"
HMAC_EXT=$(node -e "
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', process.env.MAGICBELL_SECRET_KEY);
hmac.update('$EXT_ID1');
console.log(hmac.digest('base64'));
")

curl -s -X POST https://api.magicbell.com/subscriptions \
  -H "X-MAGICBELL-API-KEY: ${MAGICBELL_API_KEY}" \
  -H "X-MAGICBELL-USER-EXTERNAL-ID: ${EXT_ID1}" \
  -H "X-MAGICBELL-USER-HMAC: ${HMAC_EXT}" \
  -H "Content-Type: application/json" \
  -d '{"subscription":{"topic":"topic-cli-'"${ZEALT_RUN_ID}"'","categories":[{"slug":"*"}]}}'

