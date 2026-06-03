import os
import re
import json
import time
import pytest
from email.header import decode_header, make_header

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_DIR = "/home/user/task"
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

def list_inbox(max_results=30):
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

def test_explicit_recipient_received_email():
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."

    expected_subject = f"Topic Broadcast {run_id}"
    expected_recipient = f"{magicbell_email}+{run_id}@gmail.com"

    # Wait a bit for emails to arrive
    time.sleep(5)

    messages = list_inbox(max_results=30)
    
    found = False
    for msg in messages:
        subject = msg.get("subject", "")
        to = msg.get("to", "")
        
        if expected_subject in subject and expected_recipient in to:
            found = True
            break

    assert found, f"Email with subject '{expected_subject}' to '{expected_recipient}' not found in inbox."

def test_broadcast_payload_in_log():
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."

    with open(LOG_FILE, "r") as f:
        content = f.read()

    # Try to extract the JSON object from the log file
    # We look for the first `{` and last `}`
    start_idx = content.find('{')
    end_idx = content.rfind('}')
    
    assert start_idx != -1 and end_idx != -1 and start_idx < end_idx, "No JSON object found in output.log."
    
    json_str = content[start_idx:end_idx+1]
    try:
        broadcast_data = json.loads(json_str)
    except json.JSONDecodeError as e:
        pytest.fail(f"Failed to parse JSON from output.log: {e}")

    # Verify the topic
    expected_topic = f"announcements-{run_id}"
    assert broadcast_data.get("topic") == expected_topic, f"Expected broadcast topic '{expected_topic}', got '{broadcast_data.get('topic')}'"

    # Verify the recipients array contains the topic subscribers flag
    recipients = broadcast_data.get("recipients", [])
    assert isinstance(recipients, list), "Recipients must be an array."

    found_topic_subscribers = False
    for recipient in recipients:
        topic_obj = recipient.get("topic")
        if isinstance(topic_obj, dict) and topic_obj.get("subscribers") is True:
            found_topic_subscribers = True
            break
            
    assert found_topic_subscribers, "Recipients array does not contain the topic subscribers flag: {'topic': {'subscribers': true}}"
