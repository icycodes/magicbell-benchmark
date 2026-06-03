import os
import time
import json
import pytest
from email.header import decode_header, make_header
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_DIR = "/home/user/magicbell-task"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")
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
    token_json = os.environ.get("GMAIL_TOKEN_JSON")
    if not token_json:
        pytest.skip("GMAIL_TOKEN_JSON environment variable is missing.")
    
    token_info = json.loads(token_json)
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

def test_log_file_exists_and_contains_broadcast_id():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    assert "Broadcast ID:" in content, f"Expected 'Broadcast ID: <broadcast_id>' in output.log, got: {content}"

def test_broadcast_email_delivered():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is missing."
    
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is missing."
    
    expected_to = f"{magicbell_email}+{run_id}@gmail.com"
    expected_subject = f"Test Broadcast {run_id}"
    
    # Retry loop to wait for email delivery (up to 30 seconds)
    max_retries = 6
    found = False
    for attempt in range(max_retries):
        messages = list_inbox(max_results=20)
        for msg in messages:
            if expected_to in msg.get("to", "") and expected_subject in msg.get("subject", ""):
                found = True
                break
        if found:
            break
        time.sleep(5)
    
    assert found, f"Expected email to {expected_to} with subject '{expected_subject}' not found in inbox."
