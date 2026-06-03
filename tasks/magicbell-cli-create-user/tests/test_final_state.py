import os
import re
import requests
import pytest

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"

def test_user_created_with_correct_attributes():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."

    # Parse log file for User ID
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    match = re.search(r"User ID:\s*([a-zA-Z0-9-]+)", content)
    assert match, f"Could not find 'User ID: <user_id>' in {LOG_FILE}. Content: {content}"
    user_id = match.group(1)

    # Use MagicBell API to fetch the user
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."

    headers = {
        "Authorization": f"Bearer {project_token}"
    }

    # Fetch user by ID
    response = requests.get(f"https://api.magicbell.com/users/{user_id}", headers=headers)
    assert response.status_code == 200, f"Failed to fetch user {user_id}: {response.text}"

    user_data = response.json().get("user", {})
    if not user_data:
        # Fallback if the response is just the user object directly
        user_data = response.json()

    expected_external_id = f"user-{run_id}"
    assert user_data.get("external_id") == expected_external_id, \
        f"Expected external_id {expected_external_id}, got {user_data.get('external_id')}"

    # Determine expected email
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."
    
    prefix = magicbell_email.split("@")[0]
    expected_email = f"{prefix}+{run_id}@gmail.com"
    
    assert user_data.get("email") == expected_email, \
        f"Expected email {expected_email}, got {user_data.get('email')}"

    assert user_data.get("first_name") == "TestUser", \
        f"Expected first_name 'TestUser', got {user_data.get('first_name')}"
    
    assert user_data.get("last_name") == run_id, \
        f"Expected last_name '{run_id}', got {user_data.get('last_name')}"
