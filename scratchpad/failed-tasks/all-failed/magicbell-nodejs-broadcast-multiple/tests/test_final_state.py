import os
import re
import json
import time
import pytest
from email.header import decode_header, make_header

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_DIR = "/home/user/project"
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

def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."

def test_broadcast_id_in_log():
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    match = re.search(r"Broadcast ID:\s*(\S+)", content)
    assert match is not None, "Could not find 'Broadcast ID: <broadcast_id>' in the log file."
    broadcast_id = match.group(1)
    assert broadcast_id, "Broadcast ID extracted is empty."

def test_emails_received():
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."

    expected_subject = f"Test Broadcast {run_id}"
    expected_recipient1 = f"{magicbell_email}+recipient1-{run_id}@gmail.com"
    expected_recipient2 = f"{magicbell_email}+recipient2-{run_id}@gmail.com"

    # Wait a bit for emails to arrive
    time.sleep(5)

    messages = list_inbox(max_results=30)
    
    found_recipient1 = False
    found_recipient2 = False

    for msg in messages:
        subject = msg.get("subject", "")
        to = msg.get("to", "")
        
        if expected_subject in subject:
            if expected_recipient1 in to:
                found_recipient1 = True
            if expected_recipient2 in to:
                found_recipient2 = True

    assert found_recipient1, f"Email with subject '{expected_subject}' to '{expected_recipient1}' not found in inbox."
    assert found_recipient2, f"Email with subject '{expected_subject}' to '{expected_recipient2}' not found in inbox."
