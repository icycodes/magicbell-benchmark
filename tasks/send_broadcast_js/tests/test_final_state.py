import os
import re
import requests
import pytest

def get_broadcast_id():
    log_path = "/home/user/myproject/output.log"
    assert os.path.isfile(log_path), f"Log file not found at {log_path}"
    with open(log_path, "r") as f:
        content = f.read().strip()
    match = re.search(r"Broadcast ID:\s*([a-zA-Z0-9\-]+)", content)
    assert match, f"Log file content does not match pattern 'Broadcast ID: <broadcast_id>'. Content: {content}"
    return match.group(1)

def test_output_log_exists():
    """Verify that the output log file exists and contains a valid broadcast ID."""
    broadcast_id = get_broadcast_id()
    assert broadcast_id != "", "Broadcast ID in log file is empty."

def test_magicbell_user_exists():
    """Verify that the user was successfully created/updated in MagicBell."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    gmail_username = os.environ.get("GMAIL_USER_NAME")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    
    url = f"https://api.magicbell.com/users/user_{run_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch user from MagicBell. Status: {response.status_code}, Response: {response.text}"
    
    user_data = response.json()
    user = user_data.get("user", user_data)
    expected_email = f"{gmail_username}+{run_id}@gmail.com"
    assert user.get("email") == expected_email, f"Expected user email to be {expected_email}, got {user.get('email')}"

def test_magicbell_broadcast_details():
    """Verify that the broadcast was successfully created with correct title and recipients."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    broadcast_id = get_broadcast_id()
    
    url = f"https://api.magicbell.com/broadcasts/{broadcast_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch broadcast from MagicBell. Status: {response.status_code}, Response: {response.text}"
    
    broadcast_data = response.json()
    broadcast = broadcast_data.get("broadcast", broadcast_data)
    
    expected_title = f"Welcome to MagicBell {run_id}!"
    assert broadcast.get("title") == expected_title, f"Expected broadcast title to be '{expected_title}', got '{broadcast.get('title')}'"
    
    recipients = broadcast.get("recipients", [])
    expected_recipient_id = f"user_{run_id}"
    
    found = False
    for r in recipients:
        if r.get("external_id") == expected_recipient_id or r.get("externalId") == expected_recipient_id:
            found = True
            break
    assert found, f"Expected recipient {expected_recipient_id} not found in broadcast recipients: {recipients}"

def test_gmail_received():
    """Verify that the email was successfully delivered to the Gmail inbox."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert "GMAIL_TOKEN_JSON" in os.environ, "GMAIL_TOKEN_JSON environment variable is missing."
    
    import json
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    
    SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
    token_info = json.loads(os.environ["GMAIL_TOKEN_JSON"])
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    service = build("gmail", "v1", credentials=creds)
    
    query = f'subject:"Welcome to MagicBell {run_id}!"'
    response = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=10,
    ).execute()
    
    messages = response.get("messages", [])
    assert len(messages) > 0, f"No email found in Gmail inbox with query: {query}"
