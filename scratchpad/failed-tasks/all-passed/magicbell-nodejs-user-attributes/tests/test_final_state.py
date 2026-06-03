import os
import re
import requests
import pytest

LOG_FILE = "/home/user/magicbell-task/output.log"

def test_output_log_exists():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"

def test_user_created_and_attributes_updated():
    run_id = os.environ.get("ZEALT_RUN_ID", "default")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    base_email = os.environ.get("MAGICBELL_EMAIL")
    
    assert project_token, "MAGICBELL_PROJECT_TOKEN is not set"
    assert base_email, "MAGICBELL_EMAIL is not set"
    
    # parse email
    name, domain = base_email.split("@")
    expected_email = f"{name}+{run_id}@{domain}"
    expected_external_id = f"user-{run_id}"
    
    # Extract user ID from log
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    match = re.search(r"User ID:\s*(\S+)", content)
    assert match is not None, f"Could not find 'User ID: <id>' in {LOG_FILE}. Content: {content}"
    user_id = match.group(1)
    
    headers = {
        "Authorization": f"Bearer {project_token}"
    }
    
    url = f"https://api.magicbell.com/users/{user_id}"
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch user {user_id}: {response.text}"
    
    data = response.json()
    user_data = data.get("user", {})
    
    assert user_data.get("email") == expected_email, f"Expected email {expected_email}, got {user_data.get('email')}"
    assert user_data.get("external_id") == expected_external_id, f"Expected external_id {expected_external_id}, got {user_data.get('external_id')}"
    
    custom_attributes = user_data.get("custom_attributes", {})
    assert custom_attributes.get("plan") == "premium", f"Expected custom_attributes.plan to be 'premium', got {custom_attributes.get('plan')}"
    assert custom_attributes.get("task") == f"user-attributes-{run_id}", f"Expected custom_attributes.task to be 'user-attributes-{run_id}', got {custom_attributes.get('task')}"
