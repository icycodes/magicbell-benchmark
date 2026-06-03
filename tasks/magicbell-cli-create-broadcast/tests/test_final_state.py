import os
import re
import json
import time
import pytest
from email.header import decode_header, make_header
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import requests

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def get_run_id():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    return run_id

def get_expected_email():
    mb_email = os.environ.get("MAGICBELL_EMAIL")
    assert mb_email, "MAGICBELL_EMAIL environment variable is not set."
    local, domain = mb_email.split("@")
    run_id = get_run_id()
    return f"{local}+cli-broadcast-{run_id}@{domain}"

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
    token_json = os.environ.get("GMAIL_TOKEN_JSON")
    assert token_json, "GMAIL_TOKEN_JSON environment variable is not set."
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
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    match = re.search(r"Broadcast ID:\s*([a-zA-Z0-9-]+)", content)
    assert match, "Could not find 'Broadcast ID: <id>' in output.log."
    broadcast_id = match.group(1)
    
    # Optional: Verify broadcast exists via REST API
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    if project_token:
        # We try fetching the broadcast. The endpoint is usually /broadcasts/{id}
        url = f"https://api.magicbell.com/broadcasts/{broadcast_id}"
        headers = {
            "Authorization": f"Bearer {project_token}",
            "Accept": "application/json"
        }
        resp = requests.get(url, headers=headers)
        # If it's a 404, maybe the endpoint is different, but if it's 200 we can check the title.
        if resp.status_code == 200:
            data = resp.json()
            # The broadcast object might be nested under 'broadcast'
            broadcast_obj = data.get("broadcast", data)
            title = broadcast_obj.get("title")
            assert title == "CLI Broadcast Test", f"Expected broadcast title to be 'CLI Broadcast Test', got '{title}'"

def test_gmail_received_broadcast():
    expected_email = get_expected_email()
    
    # Wait a bit for email delivery
    time.sleep(5)
    
    messages = list_inbox(max_results=20)
    found = False
    for msg in messages:
        if expected_email.lower() in msg["to"].lower() and "CLI Broadcast Test" in msg["subject"]:
            found = True
            break
            
    assert found, f"Did not find an email to {expected_email} with subject 'CLI Broadcast Test' in the Gmail inbox."