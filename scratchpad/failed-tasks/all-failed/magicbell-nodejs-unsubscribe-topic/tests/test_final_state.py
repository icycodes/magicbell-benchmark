import os
import subprocess
import time
import requests
import json
from email.header import decode_header, make_header
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_DIR = "/home/user/magicbell-unsubscribe"
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def decode_mime_header(value):
    if not value:
        return ""
    return str(make_header(decode_header(value)))

def get_header(headers, name):
    for header in headers:
        if header.get("name", "").lower() == name.lower():
            return decode_mime_header(header.get("value", ""))
    return ""

def list_inbox(max_results=20):
    token_info = json.loads(os.environ["GMAIL_TOKEN_JSON"])
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    service = build("gmail", "v1", credentials=creds)
    response = service.users().messages().list(
        userId="me",
        q="label:inbox",
        maxResults=max_results,
    ).execute()
    messages = response.get("messages", [])
    if not messages:
        return []
    inbox_messages = []
    for msg in messages:
        detail = service.users().messages().get(
            userId="me",
            id=msg["id"],
            format="metadata",
            metadataHeaders=["From", "To", "Subject", "Date"],
        ).execute()
        headers = detail.get("payload", {}).get("headers", [])
        inbox_messages.append(
            {
                "from": get_header(headers, "From"),
                "to": get_header(headers, "To"),
                "subject": get_header(headers, "Subject"),
                "date": get_header(headers, "Date"),
            }
        )
    return inbox_messages

def test_unsubscribe_topic():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id is not None, "ZEALT_RUN_ID is not set"
    
    email = os.environ.get("MAGICBELL_EMAIL")
    assert email is not None, "MAGICBELL_EMAIL is not set"
    
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token is not None, "MAGICBELL_PROJECT_TOKEN is not set"

    user_email = f"{email}+{run_id}@gmail.com"
    test_topic = f"test-topic-{run_id}"
    other_topic = f"other-topic-{run_id}"

    # 1. Run the user's script
    result = subprocess.run(
        ["node", "unsubscribe.js"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Script failed with output: {result.stderr}\n{result.stdout}"

    # 2. Broadcast 1: Should be dropped
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Content-Type": "application/json"
    }
    
    b1_payload = {
        "broadcast": {
            "title": "Should be dropped",
            "recipients": [{"email": user_email}],
            "topic": test_topic
        }
    }
    r1 = requests.post("https://api.magicbell.com/broadcasts", headers=headers, json=b1_payload)
    assert r1.status_code in [200, 201, 202], f"Failed to create broadcast 1: {r1.text}"

    # 3. Broadcast 2: Should be received
    b2_payload = {
        "broadcast": {
            "title": "Should be received",
            "recipients": [{"email": user_email}],
            "topic": other_topic
        }
    }
    r2 = requests.post("https://api.magicbell.com/broadcasts", headers=headers, json=b2_payload)
    assert r2.status_code in [200, 201, 202], f"Failed to create broadcast 2: {r2.text}"

    # Wait for email delivery
    time.sleep(10)

    # 4. Check emails
    inbox = list_inbox(max_results=20)
    
    received_found = False
    dropped_found = False
    
    for msg in inbox:
        if user_email.lower() in msg["to"].lower():
            if "Should be received" in msg["subject"]:
                received_found = True
            if "Should be dropped" in msg["subject"]:
                dropped_found = True

    assert received_found, "The broadcast 'Should be received' was not delivered to the user's email."
    assert not dropped_found, "The broadcast 'Should be dropped' was delivered to the user's email, meaning the user was not successfully unsubscribed from the topic."
