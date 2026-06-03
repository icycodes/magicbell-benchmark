import os
import time
import json
import subprocess
import pytest
from email.header import decode_header, make_header

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_DIR = "/home/user/magicbell-nodejs-custom-template"
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
    response = service.users().messages().list(userId="me", q="label:inbox", maxResults=max_results).execute()
    messages = response.get("messages", [])
    if not messages:
        return []
    inbox_messages = []
    for msg in messages:
        detail = service.users().messages().get(userId="me", id=msg["id"], format="metadata", metadataHeaders=["From", "To", "Subject", "Date"]).execute()
        headers = detail.get("payload", {}).get("headers", [])
        inbox_messages.append({
            "from": get_header(headers, "From"),
            "to": get_header(headers, "To"),
            "subject": get_header(headers, "Subject"),
            "date": get_header(headers, "Date"),
        })
    return inbox_messages

@pytest.fixture(scope="session")
def run_script():
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id, "ZEALT_RUN_ID is not set in the environment"
    
    email = os.environ.get("MAGICBELL_EMAIL", "")
    assert email, "MAGICBELL_EMAIL is not set in the environment"
    
    with open(os.path.join(PROJECT_DIR, "output.log"), "w") as f:
        result = subprocess.run(
            ["node", "index.js"],
            cwd=PROJECT_DIR,
            stdout=f,
            stderr=subprocess.STDOUT,
            text=True
        )
    assert result.returncode == 0, f"Script execution failed. Check output.log"
    
    # Wait for the email to be delivered
    time.sleep(10)
    
    return run_id, email

def test_script_execution_and_output(run_script):
    run_id, _ = run_script
    log_path = os.path.join(PROJECT_DIR, "output.log")
    assert os.path.isfile(log_path), f"Log file {log_path} does not exist"
    
    with open(log_path, "r") as f:
        content = f.read()
    
    assert "Broadcast ID:" in content, "The script output did not contain 'Broadcast ID:'"

def test_email_delivery(run_script):
    run_id, email_base = run_script
    expected_to = f"{email_base}+{run_id}@gmail.com"
    expected_subject = f"Custom Email Title {run_id}"
    
    inbox = list_inbox(max_results=20)
    
    found = False
    for msg in inbox:
        if expected_to.lower() in msg["to"].lower() and msg["subject"] == expected_subject:
            found = True
            break
            
    assert found, f"Email not found in inbox. Expected To: {expected_to}, Subject: {expected_subject}"
