#!/usr/bin/env bash

set -euo pipefail

RUN_ID="$1"
run_id="${ZEALT_RUN_ID}"

magicbell login --manual \
  --email "$MAGICBELL_EMAIL" \
  --jwt "$MAGICBELL_PROJECT_TOKEN" \
  --api-key "$MAGICBELL_API_KEY" \
  --secret-key "$MAGICBELL_SECRET_KEY"

magicbell workflow fetch_run --run-id "$RUN_ID" > "run_details_${run_id}.json"
