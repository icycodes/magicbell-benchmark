import os
import re
import json
import pytest
from email.header import decode_header, make_header
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
LOG_FILE = "/home/user/magicbell-cli-task/output.log"

def decode_mime_header(value):
    if not value:
        return ""
    return str(make_header(decode_header(value)))


def get_header(headers, name):
    for header in headers:
        if header.get("name", "").lower() == name.lower():
            return decode_mime_header(header.get("value", ""))
    return ""


def get_gmail_service():
    token_info = json.loads(os.environ["GMAIL_TOKEN_JSON"])
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    return build("gmail", "v1", credentials=creds)


def test_log_file_exists():
    """Verify that the output log file exists."""
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."


def test_log_file_contents():
    """Verify that the log file contains the correct output fields."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."

    with open(LOG_FILE, "r") as f:
        content = f.read()

    # Check User External ID
    expected_user_id = f"user-{run_id}"
    assert f"User External ID: {expected_user_id}" in content, \
        f"Expected 'User External ID: {expected_user_id}' in log file."

    # Check Broadcast ID
    broadcast_match = re.search(r"Broadcast ID:\s*([a-f0-9\-]+|[0-9]+)", content)
    assert broadcast_match, "Expected 'Broadcast ID: <id>' in log file."

    # Check Email Subject
    expected_subject = f"Broadcast to {run_id}"
    assert f"Email Subject: {expected_subject}" in content, \
        f"Expected 'Email Subject: {expected_subject}' in log file."


def test_email_delivery_via_gmail():
    """Verify that the email notification was successfully delivered via Gmail."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    gmail_user = os.environ.get("GMAIL_USER_NAME")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    assert gmail_user, "GMAIL_USER_NAME environment variable is not set."

    expected_to = f"{gmail_user}+{run_id}@gmail.com"
    expected_subject = f"Broadcast to {run_id}"

    service = get_gmail_service()
    
    # Search for messages matching the specific subject and recipient
    query = f"to:{expected_to} subject:\"{expected_subject}\""
    response = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=5,
    ).execute()

    messages = response.get("messages", [])
    assert messages, f"No emails found in Gmail matching query: {query}"

    # Verify the email details
    found_matching_email = False
    for msg in messages:
        detail = service.users().messages().get(
            userId="me",
            id=msg["id"],
            format="metadata",
            metadataHeaders=["From", "To", "Subject", "Date"],
        ).execute()

        headers = detail.get("payload", {}).get("headers", [])
        to_header = get_header(headers, "To")
        subject_header = get_header(headers, "Subject")
        from_header = get_header(headers, "From")

        if expected_to in to_header and expected_subject in subject_header:
            found_matching_email = True
            # Verify sender is from magicbell
            assert "magicbell" in from_header.lower(), f"Expected sender to contain 'magicbell', got: {from_header}"
            break

    assert found_matching_email, f"Could not find matching email with recipient {expected_to} and subject '{expected_subject}'."
