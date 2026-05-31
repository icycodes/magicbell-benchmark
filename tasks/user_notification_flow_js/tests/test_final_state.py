import os
import re
import json
import time
import requests
import pytest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_DIR = "/home/user/magicbell-flow"
JWT_PATH = os.path.join(PROJECT_DIR, "user_jwt.txt")
LOG_PATH = os.path.join(PROJECT_DIR, "flow.log")

def test_files_exist():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."
    assert os.path.isfile(JWT_PATH), f"User JWT file {JWT_PATH} does not exist."
    assert os.path.isfile(LOG_PATH), f"Log file {LOG_PATH} does not exist."

def test_log_content_and_magicbell_state():
    # 1. Read JWT
    with open(JWT_PATH, "r") as f:
        user_jwt = f.read().strip()
    assert user_jwt, "User JWT is empty."

    # 2. Read and parse log file
    with open(LOG_PATH, "r") as f:
        log_content = f.read()

    # Regex search for the required lines
    broadcast_match = re.search(r"Broadcast ID:\s*(\S+)", log_content)
    notification_match = re.search(r"Notification ID:\s*(\S+)", log_content)
    initial_match = re.search(r"Notification Initial State:\s*(\S+)", log_content)
    updated_match = re.search(r"Notification Updated State:\s*(\S+)", log_content)

    assert broadcast_match, "Could not find 'Broadcast ID' in flow.log"
    assert notification_match, "Could not find 'Notification ID' in flow.log"
    assert initial_match, "Could not find 'Notification Initial State' in flow.log"
    assert updated_match, "Could not find 'Notification Updated State' in flow.log"

    broadcast_id = broadcast_match.group(1)
    notification_id = notification_match.group(1)
    initial_state = initial_match.group(1)
    updated_state = updated_match.group(1)

    assert initial_state == "unread", f"Expected initial state 'unread', got '{initial_state}'"
    assert updated_state == "read", f"Expected updated state 'read', got '{updated_state}'"

    # 3. Query MagicBell API using User JWT to verify the notification status
    url = f"https://api.magicbell.com/v2/notifications/{notification_id}"
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "Accept": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch notification from MagicBell API: {response.text}"
    
    notification_data = response.json()
    assert notification_data.get("id") == notification_id, f"Notification ID mismatch: {notification_data.get('id')} vs {notification_id}"
    assert notification_data.get("read_at") is not None, "Notification read_at is null, but it should be marked as read."

def test_gmail_delivery():
    # Retrieve environment variables
    gmail_user = os.environ.get("GMAIL_USER_NAME")
    gmail_token_json = os.environ.get("GMAIL_TOKEN_JSON")
    run_id = os.environ.get("ZEALT_RUN_ID")

    assert gmail_user, "GMAIL_USER_NAME is not set."
    assert gmail_token_json, "GMAIL_TOKEN_JSON is not set."
    assert run_id, "ZEALT_RUN_ID is not set."

    # Setup Gmail API Client
    SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
    token_info = json.loads(gmail_token_json)
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    service = build("gmail", "v1", credentials=creds)

    # Search query: to the specific user email and containing the run ID in the subject
    recipient_email = f"{gmail_user}+{run_id}@gmail.com"
    query = f"to:{recipient_email} subject:\"Alert - {run_id}\""

    # Retry loop to account for email delivery latency (max 30 seconds)
    messages = []
    for _ in range(6):
        response = service.users().messages().list(
            userId="me",
            q=query
        ).execute()
        messages = response.get("messages", [])
        if messages:
            break
        time.sleep(5)

    assert messages, f"No email found delivered to {recipient_email} with subject containing run ID {run_id}"

    # Verify headers of the first matched message
    msg_id = messages[0]["id"]
    detail = service.users().messages().get(
        userId="me",
        id=msg_id,
        format="metadata",
        metadataHeaders=["Subject", "To"]
    ).execute()

    headers = detail.get("payload", {}).get("headers", [])
    headers_dict = {h["name"].lower(): h["value"] for h in headers}

    assert recipient_email in headers_dict.get("to", ""), f"Recipient mismatch. Expected {recipient_email}, got {headers_dict.get('to')}"
    assert f"Alert - {run_id}" in headers_dict.get("subject", ""), f"Subject mismatch. Expected subject containing 'Alert - {run_id}', got '{headers_dict.get('subject')}'"
