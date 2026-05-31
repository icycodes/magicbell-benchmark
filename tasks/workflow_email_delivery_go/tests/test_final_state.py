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

def test_output_log_exists():
    """Verify that the output log file exists."""
    assert os.path.isfile(LOG_FILE), f"Output log file {LOG_FILE} does not exist."

def test_workflow_run_id_in_log():
    """Verify that the workflow run ID is printed in the log."""
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    match = re.search(r"Workflow Run ID:\s*([a-zA-Z0-9_-]+)", content)
    assert match is not None, f"Could not find 'Workflow Run ID: <id>' in output.log. Content: {content}"
    run_id = match.group(1)
    assert len(run_id) > 0, "Workflow Run ID is empty."

def test_magicbell_workflow_run_success():
    """Verify the workflow run status via MagicBell API."""
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    
    zealt_run_id = os.environ.get("ZEALT_RUN_ID")
    assert zealt_run_id, "ZEALT_RUN_ID environment variable is not set."
    
    with open(LOG_FILE, "r") as f:
        content = f.read()
    match = re.search(r"Workflow Run ID:\s*([a-zA-Z0-9_-]+)", content)
    assert match is not None
    workflow_run_id = match.group(1)
    
    url = f"https://api.magicbell.com/workflows/runs/{workflow_run_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }
    
    # Wait up to 15 seconds for MagicBell to process the run
    response = None
    for _ in range(5):
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                run_data = data.get("data", data)
                assert run_data.get("id") == workflow_run_id, f"Run ID mismatch: expected {workflow_run_id}, got {run_data.get('id')}"
                break
        except Exception as e:
            pass
        time.sleep(3)
    
    assert response is not None, "Failed to connect to MagicBell API."
    assert response.status_code == 200, f"Failed to fetch workflow run from MagicBell: {response.text}"

def test_gmail_delivery():
    """Verify that the email notification was successfully delivered to Gmail."""
    gmail_username = os.environ.get("GMAIL_USER_NAME")
    gmail_token_json = os.environ.get("GMAIL_TOKEN_JSON")
    zealt_run_id = os.environ.get("ZEALT_RUN_ID")
    
    assert gmail_username, "GMAIL_USER_NAME environment variable is not set."
    assert gmail_token_json, "GMAIL_TOKEN_JSON environment variable is not set."
    assert zealt_run_id, "ZEALT_RUN_ID environment variable is not set."
    
    token_info = json.loads(gmail_token_json)
    creds = Credentials.from_authorized_user_info(token_info, ["https://www.googleapis.com/auth/gmail.readonly"])
    service = build("gmail", "v1", credentials=creds)
    
    target_email = f"{gmail_username}+{zealt_run_id}@gmail.com"
    subject_query = f"Order Notification - {zealt_run_id}"
    query = f"to:{target_email} subject:\"{subject_query}\""
    
    # Wait up to 30 seconds for the email to arrive in Gmail
    messages = []
    for _ in range(10):
        response = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=5,
        ).execute()
        messages = response.get("messages", [])
        if messages:
            break
        time.sleep(3)
        
    assert messages, f"No email found in Gmail matching query: {query}"
    
    # Fetch details of the first matching message
    msg_id = messages[0]["id"]
    msg = service.users().messages().get(
        userId="me",
        id=msg_id,
        format="full",
    ).execute()
    
    snippet = msg.get("snippet", "")
    expected_content = f"Your order has been updated successfully. Run ID: {zealt_run_id}"
    
    body_text = ""
    payload = msg.get("payload", {})
    parts = payload.get("parts", [])
    if not parts:
        body_data = payload.get("body", {}).get("data", "")
        if body_data:
            import base64
            body_text = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
    else:
        for part in parts:
            if part.get("mimeType") == "text/plain":
                body_data = part.get("body", {}).get("data", "")
                if body_data:
                    import base64
                    body_text = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
                    break
                    
    assert expected_content in snippet or expected_content in body_text, \
        f"Email content does not contain the expected content. Snippet: {snippet}. Body: {body_text}"
