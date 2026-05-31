import os
import re
import json
import requests
import pytest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def test_output_log_exists():
    """Verify that the output log file exists."""
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."

def test_workflow_execution_and_delivery():
    """Verify that the workflow was created, triggered, and email was delivered."""
    # 1. Read run-id and GMAIL_USER_NAME
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id is not None, "ZEALT_RUN_ID environment variable is not set."
    
    gmail_user_name = os.environ.get("GMAIL_USER_NAME")
    assert gmail_user_name is not None, "GMAIL_USER_NAME environment variable is not set."

    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token is not None, "MAGICBELL_PROJECT_TOKEN environment variable is not set."

    # 2. Parse the workflow run ID from the log
    with open(LOG_FILE, "r") as f:
        log_content = f.read()

    match = re.search(r"Workflow Run ID:\s*([^\s\n]+)", log_content)
    assert match is not None, f"Could not find 'Workflow Run ID: <run_id>' in log file. Log content:\n{log_content}"
    workflow_run_id = match.group(1).strip()

    # 3. Verify workflow definition in MagicBell
    workflow_key = f"onboarding-workflow-{run_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    # Fetch workflow definition
    wf_url = f"https://api.magicbell.com/v2/workflows/{workflow_key}"
    wf_response = requests.get(wf_url, headers=headers)
    assert wf_response.status_code == 200, f"Failed to fetch workflow definition from MagicBell API: {wf_response.text}"
    
    wf_data = wf_response.json()
    # Check workflow key
    assert wf_data.get("key") == workflow_key, f"Workflow key mismatch. Expected {workflow_key}, got {wf_data.get('key')}"
    
    # Check steps
    steps = wf_data.get("steps", [])
    assert len(steps) > 0, "Workflow definition contains no steps."
    
    broadcast_step = steps[0]
    assert broadcast_step.get("command") == "broadcast", f"Expected first step command to be 'broadcast', got '{broadcast_step.get('command')}'"
    
    step_input = broadcast_step.get("input", {})
    assert "Welcome to MagicBell, {{input.run_id}}!" in step_input.get("title", ""), f"Title template mismatch. Got: {step_input.get('title')}"
    assert "This is a test notification for run {{input.run_id}}." in step_input.get("content", ""), f"Content template mismatch. Got: {step_input.get('content')}"
    
    recipients = step_input.get("recipients", [])
    assert len(recipients) > 0, "No recipients defined in the broadcast step."
    assert recipients[0].get("email") == "{{input.user_email}}", f"Recipient email template mismatch. Got: {recipients[0].get('email')}"

    # 4. Verify workflow run status in MagicBell
    run_url = f"https://api.magicbell.com/v2/workflows/runs/{workflow_run_id}"
    run_response = requests.get(run_url, headers=headers)
    assert run_response.status_code == 200, f"Failed to fetch workflow run from MagicBell API: {run_response.text}"
    
    run_data = run_response.json()
    assert run_data.get("id") == workflow_run_id, f"Workflow run ID mismatch. Expected {workflow_run_id}, got {run_data.get('id')}"
    assert run_data.get("workflow_key") == workflow_key, f"Workflow run key mismatch. Expected {workflow_key}, got {run_data.get('workflow_key')}"
    
    # Check that status exists (could be completed, processed, or processing)
    assert "status" in run_data, f"Workflow run data does not contain status field: {run_data}"

    # 5. Verify email delivery using the Gmail API
    gmail_token_json = os.environ.get("GMAIL_TOKEN_JSON")
    assert gmail_token_json is not None, "GMAIL_TOKEN_JSON environment variable is not set."

    token_info = json.loads(gmail_token_json)
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    service = build("gmail", "v1", credentials=creds)

    target_email = f"{gmail_user_name}+{run_id}@gmail.com"
    query = f"to:{target_email}"
    
    gmail_response = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=10,
    ).execute()

    messages = gmail_response.get("messages", [])
    assert len(messages) > 0, f"No emails found in Gmail inbox sent to {target_email}."

    found_email = False
    for msg in messages:
        detail = service.users().messages().get(
            userId="me",
            id=msg["id"],
            format="metadata",
            metadataHeaders=["From", "To", "Subject"],
        ).execute()

        headers_list = detail.get("payload", {}).get("headers", [])
        subject = ""
        to_header = ""
        for h in headers_list:
            if h.get("name", "").lower() == "subject":
                subject = h.get("value", "")
            elif h.get("name", "").lower() == "to":
                to_header = h.get("value", "")

        if f"Welcome to MagicBell, {run_id}!" in subject and target_email in to_header:
            found_email = True
            break

    assert found_email, f"Could not find the delivered email to {target_email} with subject 'Welcome to MagicBell, {run_id}!'"
