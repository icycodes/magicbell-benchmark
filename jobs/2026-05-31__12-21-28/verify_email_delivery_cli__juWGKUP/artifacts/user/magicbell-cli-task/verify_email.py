import json
import os
import sys
import time
from typing import Optional

import requests


def refresh_access_token(token_json: dict) -> str:
    response = requests.post(
        token_json["token_uri"],
        data={
            "client_id": token_json["client_id"],
            "client_secret": token_json["client_secret"],
            "refresh_token": token_json["refresh_token"],
            "grant_type": "refresh_token",
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["access_token"]


def find_message_subject(access_token: str, query: str) -> Optional[str]:
    headers = {"Authorization": f"Bearer {access_token}"}
    list_response = requests.get(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages",
        headers=headers,
        params={"q": query, "maxResults": 5},
        timeout=30,
    )
    list_response.raise_for_status()
    messages = list_response.json().get("messages", [])
    if not messages:
        return None

    message_id = messages[0]["id"]
    message_response = requests.get(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}",
        headers=headers,
        params={"format": "metadata", "metadataHeaders": ["Subject"]},
        timeout=30,
    )
    message_response.raise_for_status()
    headers_list = message_response.json().get("payload", {}).get("headers", [])
    for header in headers_list:
        if header.get("name", "").lower() == "subject":
            return header.get("value")
    return None


def main() -> int:
    run_id = os.environ.get("ZEALT_RUN_ID")
    token_json = os.environ.get("GMAIL_TOKEN_JSON")
    if not run_id or not token_json:
        print("Missing ZEALT_RUN_ID or GMAIL_TOKEN_JSON", file=sys.stderr)
        return 1

    token_data = json.loads(token_json)
    access_token = refresh_access_token(token_data)

    query = f'subject:"Broadcast to {run_id}"'
    subject = None
    for _ in range(8):
        subject = find_message_subject(access_token, query)
        if subject:
            break
        time.sleep(5)

    if not subject:
        print("Email not found", file=sys.stderr)
        return 2

    print(subject)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
