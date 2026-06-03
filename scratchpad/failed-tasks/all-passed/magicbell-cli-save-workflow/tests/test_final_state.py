import os
import subprocess
import json
import time
from email.header import decode_header, make_header
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import pytest

PROJECT_DIR = "/home/user/myproject"
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

def test_script_exists():
    script_path = os.path.join(PROJECT_DIR, "save_workflow.sh")
    assert os.path.isfile(script_path), f"Script not found at {script_path}"

def test_run_script():
    script_path = os.path.join(PROJECT_DIR, "save_workflow.sh")
    result = subprocess.run(
        ["bash", script_path],
        capture_output=True,
        text=True,
        cwd=PROJECT_DIR
    )
    assert result.returncode == 0, f"Script execution failed: {result.stderr}"

def test_workflow_trigger_and_email_received():
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id, "ZEALT_RUN_ID environment variable is missing"

    workflow_key = f"onboarding-campaign-{run_id}"

    # Trigger the workflow
    trigger_data = json.dumps({"key": workflow_key, "input": {}})
    result = subprocess.run(
        ["magicbell", "workflow", "create_run", "--data", trigger_data],
        capture_output=True,
        text=True,
        cwd=PROJECT_DIR
    )
    assert result.returncode == 0, f"Failed to trigger workflow {workflow_key}: {result.stderr}\n{result.stdout}"

    # Verify email
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "")
    assert magicbell_email and "@" in magicbell_email, "Invalid MAGICBELL_EMAIL"
    local_part, domain = magicbell_email.split("@", 1)
    expected_email = f"{local_part}+cli-workflow-{run_id}@{domain}"

    # Wait for email delivery (retry up to 30 seconds)
    email_found = False
    for _ in range(6):
        time.sleep(5)
        messages = list_inbox(max_results=20)
        for msg in messages:
            if expected_email in msg.get("to", ""):
                email_found = True
                break
        if email_found:
            break
    
    assert email_found, f"Expected email sent to {expected_email} not found in inbox"
