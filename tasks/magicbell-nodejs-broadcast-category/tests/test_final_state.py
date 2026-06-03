import os
import json
import time
import pytest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
PROJECT_DIR = "/home/user/project"

def test_output_log_exists():
    log_file = os.path.join(PROJECT_DIR, "output.log")
    assert os.path.isfile(log_file), f"Log file {log_file} does not exist."
    with open(log_file, "r") as f:
        content = f.read()
    assert "Broadcast ID: " in content, f"Expected 'Broadcast ID: ' in {log_file}, got: {content}"

def test_email_received_via_gmail():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."
    
    if "@" in magicbell_email:
        username = magicbell_email.split("@")[0]
    else:
        username = magicbell_email
        
    target_email = f"{username}+{run_id}@gmail.com"
    
    token_info_str = os.environ.get("GMAIL_TOKEN_JSON")
    assert token_info_str, "GMAIL_TOKEN_JSON environment variable is not set."
    
    token_info = json.loads(token_info_str)
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    service = build("gmail", "v1", credentials=creds)

    query = f"to:{target_email} subject:{run_id}"
    
    max_retries = 10
    found = False
    for _ in range(max_retries):
        response = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=10,
        ).execute()
        
        messages = response.get("messages", [])
        if messages:
            found = True
            break
        time.sleep(3)
        
    assert found, f"No email found for {target_email} with subject containing {run_id} after {max_retries} retries."