import os
import re
import json
import time
import requests
import pytest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

@pytest.fixture(scope="session")
def run_id():
    rid = os.environ.get("ZEALT_RUN_ID")
    assert rid is not None, "ZEALT_RUN_ID environment variable is not set."
    return rid

@pytest.fixture(scope="session")
def gmail_user_name():
    uname = os.environ.get("GMAIL_USER_NAME")
    assert uname is not None, "GMAIL_USER_NAME environment variable is not set."
    return uname

@pytest.fixture(scope="session")
def magicbell_project_token():
    token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert token is not None, "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    return token

@pytest.fixture(scope="session")
def extracted_info(run_id, gmail_user_name):
    assert os.path.isfile(LOG_FILE), f"Output log file not found at {LOG_FILE}"
    
    with open(LOG_FILE, "r") as f:
        content = f.read()
        
    broadcast_id_match = re.search(r"Broadcast ID:\s*([a-zA-Z0-9\-]+)", content, re.IGNORECASE)
    recipient_match = re.search(r"Recipient:\s*([^\s]+)", content, re.IGNORECASE)
    
    assert broadcast_id_match is not None, "Could not find 'Broadcast ID' in output.log"
    assert recipient_match is not None, "Could not find 'Recipient' in output.log"
    
    broadcast_id = broadcast_id_match.group(1).strip()
    recipient_email = recipient_match.group(1).strip()
    
    expected_recipient = f"{gmail_user_name}+{run_id}@gmail.com"
    assert recipient_email == expected_recipient, f"Expected recipient email to be '{expected_recipient}', but got '{recipient_email}'"
    
    return {
        "broadcast_id": broadcast_id,
        "recipient_email": recipient_email
    }

def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file does not exist at {LOG_FILE}"

def test_log_file_contents(extracted_info):
    assert extracted_info["broadcast_id"], "Broadcast ID is empty"
    assert extracted_info["recipient_email"], "Recipient email is empty"

def test_magicbell_broadcast_details(extracted_info, magicbell_project_token, run_id):
    broadcast_id = extracted_info["broadcast_id"]
    recipient_email = extracted_info["recipient_email"]
    
    url = f"https://api.magicbell.com/v2/broadcasts/{broadcast_id}"
    headers = {
        "Authorization": f"Bearer {magicbell_project_token}",
        "Accept": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch broadcast from MagicBell API: status {response.status_code}, response: {response.text}"
    
    data = response.json()
    
    # Check title and content
    expected_title = f"Alert: System Event {run_id}"
    expected_content = f"A system event has occurred in run {run_id}"
    
    assert data.get("title") == expected_title, f"Expected title '{expected_title}', but got '{data.get('title')}'"
    assert data.get("content") == expected_content, f"Expected content '{expected_content}', but got '{data.get('content')}'"
    
    # Check recipient
    recipients = data.get("recipients", [])
    assert len(recipients) > 0, "No recipients found in the broadcast details on MagicBell"
    
    recipient_emails = [r.get("email") for r in recipients if "email" in r]
    assert recipient_email in recipient_emails, f"Expected recipient '{recipient_email}' to be in broadcast recipients list: {recipient_emails}"

def test_gmail_received(extracted_info, run_id):
    recipient_email = extracted_info["recipient_email"]
    gmail_token_json = os.environ.get("GMAIL_TOKEN_JSON")
    assert gmail_token_json is not None, "GMAIL_TOKEN_JSON environment variable is not set."
    
    token_info = json.loads(gmail_token_json)
    creds = Credentials.from_authorized_user_info(token_info, ["https://www.googleapis.com/auth/gmail.readonly"])
    service = build("gmail", "v1", credentials=creds)
    
    # Poll Gmail inbox for up to 45 seconds to allow for delivery
    query = f"to:{recipient_email}"
    start_time = time.time()
    messages = []
    
    while time.time() - start_time < 45:
        response = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=5
        ).execute()
        messages = response.get("messages", [])
        if messages:
            break
        time.sleep(5)
        
    assert len(messages) > 0, f"No emails found in Gmail inbox for recipient {recipient_email} after 45 seconds."
