import os
import re
import json
import time
import requests
import pytest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

LOG_FILE = "/home/user/myproject/output.log"

@pytest.fixture(scope="module")
def run_id():
    rid = os.getenv("ZEALT_RUN_ID")
    assert rid, "ZEALT_RUN_ID environment variable is not set."
    return rid

@pytest.fixture(scope="module")
def gmail_username():
    username = os.getenv("GMAIL_USER_NAME")
    assert username, "GMAIL_USER_NAME environment variable is not set."
    return username

@pytest.fixture(scope="module")
def project_token():
    token = os.getenv("MAGICBELL_PROJECT_TOKEN")
    assert token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    return token

def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}."

def test_broadcast_id_in_log(project_token, run_id, gmail_username):
    # Read the log file and extract the Broadcast ID
    with open(LOG_FILE, "r") as f:
        content = f.read().strip()
    
    match = re.search(r"Broadcast ID:\s*([a-f0-9\-]+)", content, re.IGNORECASE)
    assert match, f"Could not find a valid 'Broadcast ID: <id>' pattern in {LOG_FILE}. Content: {content}"
    
    broadcast_id = match.group(1)
    
    # Verify the broadcast via MagicBell API
    url = f"https://api.magicbell.com/v2/broadcasts/{broadcast_id}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {project_token}"
    }
    
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch broadcast from MagicBell API: {response.text}"
    
    data = response.json()
    assert f"Verification Run {run_id}" in data.get("title", ""), \
        f"Expected broadcast title to contain 'Verification Run {run_id}', but got '{data.get('title')}'"
    
    # Check recipients
    recipients = data.get("recipients", [])
    expected_email = f"{gmail_username}+{run_id}@gmail.com".lower()
    
    found_recipient = False
    for r in recipients:
        if r.get("email", "").lower() == expected_email:
            found_recipient = True
            break
            
    assert found_recipient, f"Expected recipient {expected_email} was not found in broadcast recipients list: {recipients}"

def test_email_delivery_via_gmail(gmail_username, run_id):
    token_json_str = os.getenv("GMAIL_TOKEN_JSON")
    assert token_json_str, "GMAIL_TOKEN_JSON environment variable is not set."
    
    token_info = json.loads(token_json_str)
    creds = Credentials.from_authorized_user_info(token_info, ["https://www.googleapis.com/auth/gmail.readonly"])
    service = build("gmail", "v1", credentials=creds)
    
    expected_recipient = f"{gmail_username}+{run_id}@gmail.com".lower()
    query = f"to:{expected_recipient}"
    
    # Poll for the email for up to 60 seconds
    start_time = time.time()
    email_found = False
    msg_detail = None
    
    while time.time() - start_time < 60:
        response = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=5
        ).execute()
        
        messages = response.get("messages", [])
        if messages:
            # Fetch details of the latest message
            msg_id = messages[0]["id"]
            msg_detail = service.users().messages().get(
                userId="me",
                id=msg_id,
                format="full"
            ).execute()
            email_found = True
            break
        time.sleep(5)
        
    assert email_found, f"No email found in Gmail inbox sent to {expected_recipient} after 60 seconds."
    
    # Verify subject and body/snippet
    payload = msg_detail.get("payload", {})
    headers = payload.get("headers", [])
    
    subject = ""
    for h in headers:
        if h.get("name", "").lower() == "subject":
            subject = h.get("value", "")
            break
            
    assert f"Verification Run {run_id}" in subject, \
        f"Expected email subject to contain 'Verification Run {run_id}', but got '{subject}'"
        
    snippet = msg_detail.get("snippet", "")
    assert f"This is a test notification for run {run_id}" in snippet, \
        f"Expected snippet to contain test notification message, but got: {snippet}"
