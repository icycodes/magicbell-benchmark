import os
import json
import time
import requests
import pytest
from email.header import decode_header, make_header
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

LOG_FILE = "/home/user/myproject/output.log"
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

def list_inbox(max_results=10):
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

def test_log_file_exists_and_content():
    """Verify that the script was executed and log file contains success message."""
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."
    with open(LOG_FILE, "r") as f:
        content = f.read()
    assert "Subscription successful" in content, f"Expected 'Subscription successful' in output.log, got: {content}"

def test_broadcast_and_email_received():
    """Send a broadcast to the topic and verify the user receives it via Gmail."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID is not set"

    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    assert magicbell_email, "MAGICBELL_EMAIL is not set"

    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    api_key = os.environ.get("MAGICBELL_API_KEY")

    local_part, domain = magicbell_email.split("@", 1)
    target_email = f"{local_part}+topic-sub-{run_id}@{domain}"
    topic_name = f"updates-{run_id}"
    subject = f"Topic Update {run_id}"

    # Send broadcast to the topic
    url = "https://api.magicbell.com/broadcasts"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "X-MAGICBELL-API-KEY": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "broadcast": {
            "title": subject,
            "recipients": [{"topic": {"subscribers": True}}],
            "topic": topic_name
        }
    }

    response = requests.post(url, headers=headers, json=payload)
    assert response.status_code in (201, 202, 200), f"Failed to send broadcast: {response.text}"

    # Wait for email delivery
    time.sleep(10)

    # Check inbox for the email
    messages = list_inbox(max_results=20)
    
    found = False
    for msg in messages:
        if subject in msg["subject"] and target_email in msg["to"]:
            found = True
            break
            
    assert found, f"Email with subject '{subject}' to '{target_email}' not found in inbox."
