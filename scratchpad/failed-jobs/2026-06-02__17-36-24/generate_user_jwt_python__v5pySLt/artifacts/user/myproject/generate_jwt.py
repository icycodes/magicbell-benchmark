#!/usr/bin/env python3
"""
Generate a MagicBell User JWT with PyJWT.

Steps:
1. Read required environment variables.
2. Compute the user email and external id from ZEALT_RUN_ID / MAGICBELL_EMAIL.
3. Upsert the MagicBell user via the v2 REST API (PUT /users, authenticated with
   the Project JWT).
4. Build a JWT payload {user_email, user_external_id, api_key} and HS256-sign it.
5. Write the resulting token to output.log.
"""

import os
import sys
import datetime
import jwt
import requests

# ---------------------------------------------------------------------------
# 1. Read environment variables
# ---------------------------------------------------------------------------
ZEALT_RUN_ID            = os.environ["ZEALT_RUN_ID"]
MAGICBELL_EMAIL         = os.environ["MAGICBELL_EMAIL"]
MAGICBELL_PROJECT_TOKEN = os.environ["MAGICBELL_PROJECT_TOKEN"]
MAGICBELL_API_KEY       = os.environ["MAGICBELL_API_KEY"]
MAGICBELL_SECRET_KEY    = os.environ["MAGICBELL_SECRET_KEY"]

# ---------------------------------------------------------------------------
# 2. Derive user email and external id
# ---------------------------------------------------------------------------
local, domain    = MAGICBELL_EMAIL.split("@", 1)
user_email       = f"{local}+jwt-python-{ZEALT_RUN_ID}@{domain}"
user_external_id = f"user-jwt-python-{ZEALT_RUN_ID}"

print(f"User email      : {user_email}")
print(f"User external id: {user_external_id}")

# ---------------------------------------------------------------------------
# 3. Upsert the MagicBell user via the v2 REST API
#    Endpoint: PUT https://api.magicbell.com/v2/users
#    Auth:     Authorization: Bearer <project_jwt>
# ---------------------------------------------------------------------------
api_base = "https://api.magicbell.com/v2"

headers = {
    "Authorization": f"Bearer {MAGICBELL_PROJECT_TOKEN}",
    "Content-Type":  "application/json",
    "Accept":        "application/json",
}

user_payload = {
    "external_id": user_external_id,
    "email":       user_email,
    "first_name":  "JWT",
    "last_name":   "Python",
}

response = requests.put(
    f"{api_base}/users",
    json=user_payload,
    headers=headers,
    timeout=30,
)

if response.status_code not in (200, 201):
    print(
        f"ERROR: Failed to upsert user. Status {response.status_code}: {response.text}",
        file=sys.stderr,
    )
    sys.exit(1)

print(f"User upserted successfully (HTTP {response.status_code})")

# ---------------------------------------------------------------------------
# 4. Build JWT payload and sign with HS256
# ---------------------------------------------------------------------------
expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)

jwt_payload = {
    "user_email":       user_email,
    "user_external_id": user_external_id,
    "api_key":          MAGICBELL_API_KEY,
    "exp":              expiration,
}

token = jwt.encode(jwt_payload, MAGICBELL_SECRET_KEY, algorithm="HS256")

# PyJWT >= 2.x returns str; older versions return bytes — normalise just in case
if isinstance(token, bytes):
    token = token.decode("utf-8")

print("JWT generated successfully")

# ---------------------------------------------------------------------------
# 5. Write the token to output.log
# ---------------------------------------------------------------------------
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output.log")

with open(output_path, "w") as f:
    f.write(f"User JWT: {token}\n")

print(f"Token written to {output_path}")
