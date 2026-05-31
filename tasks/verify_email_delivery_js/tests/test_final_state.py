import os
import json
import re
import pytest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

LOG_FILE = "/home/user/magicbell-email-delivery/output.log"
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def test_log_file_exists():
    """Verify that the output log file exists."""
    assert os.path.isfile(LOG_FILE), f"Expected log file to exist at {LOG_FILE}"

def test_log_file_contents():
    """Verify that the log file contains the required outputs with correct formatting and run-id."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    gmail_username = os.environ.get("GMAIL_USER_NAME")
    
    assert run_id is not None, "ZEALT_RUN_ID environment variable is not set"
    assert gmail_username is not None, "GMAIL_USER_NAME environment variable is not set"

    expected_to = f"{gmail_username}+{run_id}@gmail.com"
    expected_subject = f"Security Alert: Login from New Device [{run_id}]"

    with open(LOG_FILE, "r") as f:
        content = f.read()

    # Check for Broadcast ID
    broadcast_match = re.search(r"Broadcast ID:\s*([a-f0-9-]+|[a-zA-Z0-9_-]+)", content)
    assert broadcast_match is not None, f"Could not find 'Broadcast ID: <id>' in log file. Content:\n{content}"
    broadcast_id = broadcast_match.group(1)
    print(f"Found Broadcast ID: {broadcast_id}")

    # Check for Email Received To
    to_match = re.search(r"Email Received To:\s*(\S+)", content)
    assert to_match is not None, f"Could not find 'Email Received To: <email>' in log file."
    assert to_match.group(1).lower() == expected_to.lower(), f"Expected recipient '{expected_to}', got '{to_match.group(1)}'"

    # Check for Email Received Subject
    subject_match = re.search(r"Email Received Subject:\s*(.+)", content)
    assert subject_match is not None, f"Could not find 'Email Received Subject: <subject>' in log file."
    assert expected_subject in subject_match.group(1), f"Expected subject to contain '{expected_subject}', got '{subject_match.group(1)}'"

def test_gmail_real_delivery():
    """Verify via Gmail API that the email was actually delivered to the recipient."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    gmail_username = os.environ.get("GMAIL_USER_NAME")
    gmail_token_json = os.environ.get("GMAIL_TOKEN_JSON")

    assert run_id is not None, "ZEALT_RUN_ID environment variable is not set"
    assert gmail_username is not None, "GMAIL_USER_NAME environment variable is not set"
    assert gmail_token_json is not None, "GMAIL_TOKEN_JSON environment variable is not set"

    expected_to = f"{gmail_username}+{run_id}@gmail.com"
    expected_subject = f"Security Alert: Login from New Device [{run_id}]"

    # Load Gmail credentials
    token_info = json.loads(gmail_token_json)
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    service = build("gmail", "v1", credentials=creds)

    # Search for the message in the inbox
    query = f"to:{expected_to} subject:\"{expected_subject}\""
    print(f"Searching Gmail with query: {query}")
    
    response = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=5
    ).execute()

    messages = response.get("messages", [])
    assert len(messages) > 0, f"No email found in Gmail inbox matching query: {query}"

    # Verify metadata of the first matching message
    msg_id = messages[0]["id"]
    detail = service.users().messages().get(
        userId="me",
        id=msg_id,
        format="metadata",
        metadataHeaders=["From", "To", "Subject"]
    ).execute()

    headers = detail.get("payload", {}).get("headers", [])
    
    headers_dict = {h["name"].lower(): h["value"] for h in headers}
    
    actual_to = headers_dict.get("to", "")
    actual_subject = headers_dict.get("subject", "")

    assert expected_to.lower() in actual_to.lower(), f"Expected To: {expected_to}, got: {actual_to}"
    assert expected_subject in actual_subject, f"Expected Subject: {expected_subject}, got: {actual_subject}"
