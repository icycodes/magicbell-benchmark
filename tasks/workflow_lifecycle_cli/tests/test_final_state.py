import os
import re
import json
import subprocess
import pytest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_DIR = "/home/user/myproject"
LOG_PATH = os.path.join(PROJECT_DIR, "workflow.log")

def test_log_file_exists():
    """Verify that the log file workflow.log exists in the project directory."""
    assert os.path.isfile(LOG_PATH), f"Log file not found at {LOG_PATH}"

def test_workflow_lifecycle_and_cli_details():
    """Extract workflow key and run ID from the log file and verify via MagicBell CLI."""
    zealt_run_id = os.environ.get("ZEALT_RUN_ID")
    assert zealt_run_id is not None, "ZEALT_RUN_ID environment variable is not set."

    with open(LOG_PATH, "r") as f:
        log_content = f.read()

    # Extract workflow key and run ID
    workflow_key_match = re.search(r"Workflow Key:\s*(\S+)", log_content)
    run_id_match = re.search(r"Run ID:\s*(\S+)", log_content)

    assert workflow_key_match, "Could not find 'Workflow Key' in workflow.log"
    assert run_id_match, "Could not find 'Run ID' in workflow.log"

    workflow_key = workflow_key_match.group(1)
    run_id = run_id_match.group(1)

    # Verify workflow key naming convention
    expected_key = f"workflow-cli-{zealt_run_id}"
    assert workflow_key == expected_key, f"Expected workflow key to be {expected_key}, but got {workflow_key}"
    assert len(run_id) > 0, "Run ID must not be empty"

    # Authenticate MagicBell CLI non-interactively
    login_cmd = [
        "magicbell", "login", "--manual",
        "--email", os.environ["MAGICBELL_EMAIL"],
        "--jwt", os.environ["MAGICBELL_PROJECT_TOKEN"],
        "--api-key", os.environ["MAGICBELL_API_KEY"],
        "--secret-key", os.environ["MAGICBELL_SECRET_KEY"]
    ]
    subprocess.run(login_cmd, capture_output=True, check=True)

    # Fetch run details using the MagicBell CLI
    fetch_cmd = ["magicbell", "workflow", "fetch_run", "--run_id", run_id]
    result = subprocess.run(fetch_cmd, capture_output=True, text=True)
    assert result.returncode == 0, f"Failed to fetch workflow run details: {result.stderr}"

    # Verify run details output contains relevant identifiers
    assert run_id in result.stdout, f"Expected run ID {run_id} to be in the CLI fetch run output."
    assert workflow_key in result.stdout, f"Expected workflow key {workflow_key} to be in the CLI fetch run output."

def test_email_delivery_via_gmail():
    """Verify that the email notification sent by the workflow is received in the Gmail inbox."""
    zealt_run_id = os.environ.get("ZEALT_RUN_ID")
    gmail_user_name = os.environ.get("GMAIL_USER_NAME")
    gmail_token_json = os.environ.get("GMAIL_TOKEN_JSON")

    assert zealt_run_id is not None, "ZEALT_RUN_ID environment variable is not set."
    assert gmail_user_name is not None, "GMAIL_USER_NAME environment variable is not set."
    assert gmail_token_json is not None, "GMAIL_TOKEN_JSON environment variable is not set."

    token_info = json.loads(gmail_token_json)
    creds = Credentials.from_authorized_user_info(token_info, ["https://www.googleapis.com/auth/gmail.readonly"])
    service = build("gmail", "v1", credentials=creds)

    # Construct search query to find the specific email
    recipient_email = f"{gmail_user_name}+workflow_cli_{zealt_run_id}@gmail.com"
    subject_query = f"Workflow CLI Run {zealt_run_id}"
    query = f"to:{recipient_email} subject:\"{subject_query}\""

    response = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=5
    ).execute()

    messages = response.get("messages", [])
    assert messages, f"No email found matching query: {query}"

    # Fetch details of the first matching message
    msg_id = messages[0]["id"]
    detail = service.users().messages().get(
        userId="me",
        id=msg_id,
        format="full"
    ).execute()

    snippet = detail.get("snippet", "")
    assert f"run {zealt_run_id}" in snippet.lower() or "test email" in snippet.lower(), \
        f"Email snippet does not match expected content. Snippet: {snippet}"
