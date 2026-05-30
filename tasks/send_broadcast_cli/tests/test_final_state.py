import os
import json
import re
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

def test_log_file_exists_and_contains_broadcast_id():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    # Check for "Broadcast ID: <id>"
    match = re.search(r"Broadcast ID:\s*\S+", content)
    assert match is not None, f"Log file {LOG_FILE} does not contain 'Broadcast ID: <id>'. Content: {content}"

def test_email_received_in_gmail():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id is not None, "ZEALT_RUN_ID environment variable is not set."
    
    gmail_user = os.environ.get("GMAIL_USER_NAME")
    assert gmail_user is not None, "GMAIL_USER_NAME environment variable is not set."
    
    target_email = f"{gmail_user}+{run_id}@gmail.com"
    expected_subject = f"Maintenance Update - {run_id}"
    
    token_json = os.environ.get("GMAIL_TOKEN_JSON")
    assert token_json is not None, "GMAIL_TOKEN_JSON environment variable is not set."
    
    token_info = json.loads(token_json)
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    service = build("gmail", "v1", credentials=creds)

    response = service.users().messages().list(
        userId="me",
        q=f"to:{target_email}",
        maxResults=10,
    ).execute()

    messages = response.get("messages", [])
    assert messages, f"No emails found in Gmail inbox sent to {target_email}."

    found_matching_email = False
    for msg in messages:
        detail = service.users().messages().get(
            userId="me",
            id=msg["id"],
            format="metadata",
            metadataHeaders=["From", "To", "Subject", "Date"],
        ).execute()

        headers = detail.get("payload", {}).get("headers", [])
        subject = get_header(headers, "Subject")
        to_header = get_header(headers, "To")

        if expected_subject in subject and target_email in to_header:
            found_matching_email = True
            break

    assert found_matching_email, f"Could not find an email with subject containing '{expected_subject}' sent to {target_email}."
