import os
import re
import requests
import pytest

PROJECT_DIR = "/home/user/magicbell-project"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

def test_log_file_exists_and_contains_broadcast_id():
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."
    
    with open(LOG_FILE, "r") as f:
        content = f.read()
        
    match = re.search(r"Broadcast ID:\s*([a-zA-Z0-9\-]+)", content)
    assert match is not None, f"Could not find 'Broadcast ID: <broadcast_id>' in {LOG_FILE}. Content: {content}"
    
    broadcast_id = match.group(1)
    
    # Store the broadcast ID in the environment or a global variable for the next test
    os.environ["TEST_BROADCAST_ID"] = broadcast_id

def test_broadcast_details():
    broadcast_id = os.environ.get("TEST_BROADCAST_ID")
    assert broadcast_id is not None, "Broadcast ID not found from the previous test."
    
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id is not None, "ZEALT_RUN_ID environment variable is not set."
    
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token is not None, "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    
    base_email = os.environ.get("MAGICBELL_EMAIL")
    assert base_email is not None, "MAGICBELL_EMAIL environment variable is not set."
    
    # The email format is expected to be {MAGICBELL_EMAIL}+<run-id>@gmail.com
    expected_email = f"{base_email}+{run_id}@gmail.com"
        
    url = f"https://api.magicbell.com/broadcasts/{broadcast_id}"
    headers = {
        "Authorization": f"Bearer {project_token}"
    }
    
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch broadcast details: {response.text}"
    
    data = response.json()
    broadcast = data.get("broadcast", {})
    
    recipients = broadcast.get("recipients", [])
    recipient_emails = [r.get("email") for r in recipients if "email" in r]
    
    assert expected_email in recipient_emails, f"Expected recipient {expected_email} not found in recipients: {recipient_emails}"
    
    overrides = broadcast.get("overrides", {})
    
    # Check if email channel is disabled
    # In magicbell-js, disabling a channel in overrides is usually done by setting it to { disabled: true }
    # Let's check if it exists in channels.email or providers.email or somewhere indicating it's disabled.
    # The exact structure depends on how the agent implements it, but we can verify if 'email' is explicitly disabled.
    
    is_email_disabled = False
    
    # Check channels.email.disabled
    channels = overrides.get("channels", {})
    if isinstance(channels, dict) and "email" in channels:
        email_override = channels["email"]
        if isinstance(email_override, dict) and email_override.get("disabled") is True:
            is_email_disabled = True
            
    # Check providers.email.disabled (in case they used providers)
    providers = overrides.get("providers", {})
    if isinstance(providers, dict) and "email" in providers:
        email_override = providers["email"]
        if isinstance(email_override, dict) and email_override.get("disabled") is True:
            is_email_disabled = True
            
    assert is_email_disabled, f"Expected email channel to be disabled in overrides, but found overrides: {overrides}"
