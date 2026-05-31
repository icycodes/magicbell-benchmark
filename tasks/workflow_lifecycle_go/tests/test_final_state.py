import os
import re
import json
import time
import requests
import pytest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from email.header import decode_header, make_header

LOG_FILE = "/home/user/myproject/output.log"

def decode_mime_header(value):
    if not value:
        return ""
    return str(make_header(decode_header(value)))

def get_header(headers, name):
    for header in headers:
        if header.get("name", "").lower() == name.lower():
            return decode_mime_header(header.get("value", ""))
    return ""

def parse_log_file():
    assert os.path.isfile(LOG_FILE), f"Output log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        content = f.read()

    # Parse Workflow Key
    key_match = re.search(r"Workflow Key:\s*(lifecycle-\S+)", content)
    assert key_match is not None, "Could not find 'Workflow Key: lifecycle-<id>' in output.log"
    workflow_key = key_match.group(1)

    # Parse Run ID
    run_id_match = re.search(r"Run ID:\s*(\S+)", content)
    assert run_id_match is not None, "Could not find 'Run ID: <id>' in output.log"
    run_id = run_id_match.group(1)

    # Parse Recipient
    recipient_match = re.search(r"Recipient:\s*(\S+)", content)
    assert recipient_match is not None, "Could not find 'Recipient: <email>' in output.log"
    recipient = recipient_match.group(1)

    return workflow_key, run_id, recipient

def test_output_log_exists_and_format_is_correct():
    """Verify that the output log file exists and contains the correct format and values."""
    run_id_env = os.environ.get("ZEALT_RUN_ID")
    gmail_user = os.environ.get("GMAIL_USER_NAME")
    
    assert run_id_env is not None, "ZEALT_RUN_ID environment variable is missing"
    assert gmail_user is not None, "GMAIL_USER_NAME environment variable is missing"

    workflow_key, run_id, recipient = parse_log_file()

    expected_key = f"lifecycle-{run_id_env}"
    expected_recipient = f"{gmail_user}+{run_id_env}@gmail.com"

    assert workflow_key == expected_key, f"Expected workflow key to be '{expected_key}', but got '{workflow_key}'"
    assert recipient == expected_recipient, f"Expected recipient to be '{expected_recipient}', but got '{recipient}'"
    assert len(run_id) > 0, "Run ID in log cannot be empty"

def test_workflow_run_status():
    """Verify that the workflow run was created and exists on MagicBell."""
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    run_id_env = os.environ.get("ZEALT_RUN_ID")
    
    assert project_token is not None, "MAGICBELL_PROJECT_TOKEN environment variable is missing"
    assert run_id_env is not None, "ZEALT_RUN_ID environment variable is missing"

    _, run_id, _ = parse_log_file()

    url = f"https://api.magicbell.com/workflows/runs/{run_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json"
    }

    # Fetch workflow run details
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch workflow run from MagicBell API. Status: {response.status_code}, Body: {response.text}"
    
    data = response.json()
    # The response should contain the workflow run details
    # Let's verify the key of the workflow run
    workflow_data = data.get("data", {})
    actual_key = workflow_data.get("workflow_key")
    expected_key = f"lifecycle-{run_id_env}"
    assert actual_key == expected_key, f"Workflow run key mismatch. Expected '{expected_key}', got '{actual_key}'"

def test_email_delivery():
    """Verify that the workflow run dispatched the email and it was received in Gmail."""
    gmail_user = os.environ.get("GMAIL_USER_NAME")
    run_id_env = os.environ.get("ZEALT_RUN_ID")
    gmail_token_json = os.environ.get("GMAIL_TOKEN_JSON")

    assert gmail_user is not None, "GMAIL_USER_NAME environment variable is missing"
    assert run_id_env is not None, "ZEALT_RUN_ID environment variable is missing"
    assert gmail_token_json is not None, "GMAIL_TOKEN_JSON environment variable is missing"

    SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
    token_info = json.loads(gmail_token_json)
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    service = build("gmail", "v1", credentials=creds)

    target_email = f"{gmail_user}+{run_id_env}@gmail.com"
    expected_subject = f"Lifecycle Test {run_id_env}"

    email_found = False
    max_retries = 12
    delay = 10

    for attempt in range(max_retries):
        try:
            q = f"to:{target_email}"
            response = service.users().messages().list(
                userId="me",
                q=q,
                maxResults=10,
            ).execute()

            messages = response.get("messages", [])
            for msg in messages:
                detail = service.users().messages().get(
                    userId="me",
                    id=msg["id"],
                    format="metadata",
                    metadataHeaders=["From", "To", "Subject", "Date"],
                ).execute()

                headers = detail.get("payload", {}).get("headers", [])
                subject = get_header(headers, "Subject")
                to_field = get_header(headers, "To")

                if expected_subject in subject and target_email in to_field:
                    email_found = True
                    break
            if email_found:
                break
        except Exception as e:
            print(f"Error checking Gmail (attempt {attempt+1}): {e}")
        
        time.sleep(delay)

    assert email_found, f"Could not find dispatched email to {target_email} with subject '{expected_subject}' in Gmail inbox after {max_retries * delay} seconds."
