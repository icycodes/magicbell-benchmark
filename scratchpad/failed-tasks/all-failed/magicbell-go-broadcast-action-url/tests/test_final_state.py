import os
import re
import json
import requests
import time
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
            format="full",
        ).execute()

        headers = detail.get("payload", {}).get("headers", [])
        
        # Extract body if we need to check for action URL in email
        # But we only strictly need to verify the To address as per truth
        inbox_messages.append(
            {
                "from": get_header(headers, "From"),
                "to": get_header(headers, "To"),
                "subject": get_header(headers, "Subject"),
                "date": get_header(headers, "Date"),
                "id": msg["id"]
            }
        )

    return inbox_messages

def test_log_file_exists_and_contains_broadcast_id():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"
    
    with open(LOG_FILE, "r") as f:
        content = f.read()
        
    match = re.search(r"Broadcast ID:\s*(\S+)", content)
    assert match is not None, f"Could not find 'Broadcast ID: <id>' in log file. Content: {content}"
    
    broadcast_id = match.group(1)
    assert broadcast_id, "Broadcast ID is empty"

def test_broadcast_exists_in_magicbell():
    with open(LOG_FILE, "r") as f:
        content = f.read()
    match = re.search(r"Broadcast ID:\s*(\S+)", content)
    assert match is not None, "Broadcast ID not found in log file"
    broadcast_id = match.group(1)
    
    # Use MagicBell API to fetch the broadcast
    api_key = os.environ.get("MAGICBELL_API_KEY")
    api_secret = os.environ.get("MAGICBELL_SECRET_KEY")
    
    headers = {
        "X-MAGICBELL-API-KEY": api_key,
        "X-MAGICBELL-API-SECRET": api_secret,
    }
    
    # We can fetch the broadcast details
    response = requests.get(f"https://api.magicbell.com/broadcasts/{broadcast_id}", headers=headers)
    assert response.status_code == 200, f"Failed to fetch broadcast from MagicBell API: {response.text}"
    
    data = response.json()
    broadcast = data.get("broadcast", {})
    
    assert "action_url" in broadcast and broadcast["action_url"], "Broadcast does not contain an action URL"
    
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id in broadcast["action_url"], f"Action URL does not contain the run-id {run_id}"

def test_email_received_in_gmail():
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "")
    expected_to = f"{magicbell_email}+{run_id}@gmail.com"
    
    # Wait a bit for email to be delivered
    time.sleep(5)
    
    messages = list_inbox(max_results=20)
    
    found = False
    for msg in messages:
        if expected_to.lower() in msg["to"].lower():
            found = True
            break
            
    assert found, f"Did not find an email sent to {expected_to} in the Gmail inbox."
