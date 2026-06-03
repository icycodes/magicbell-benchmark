import os
import re
import requests
import pytest

PROJECT_DIR = "/home/user/magicbell-go-create-user-language"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

def test_log_file_exists():
    """Verify that the log file is created."""
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."

def test_user_created_with_language_preference():
    """Fetch the user from MagicBell API and verify properties."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."

    base_email = os.environ.get("MAGICBELL_EMAIL")
    assert base_email, "MAGICBELL_EMAIL environment variable is not set."

    expected_email = f"{base_email}+{run_id}@gmail.com"
    expected_external_id = f"user-{run_id}"

    # Verify log file contains the User ID
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    match = re.search(r"User ID:\s*([a-zA-Z0-9-]+)", content)
    assert match, f"Could not find 'User ID: <user_id>' format in {LOG_FILE}. Content: {content}"
    user_id = match.group(1)

    # Use MagicBell API to fetch the user
    # Try fetching by external ID
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."

    headers = {
        "Authorization": f"Bearer {project_token}"
    }

    # Fetch users list and find the user
    response = requests.get("https://api.magicbell.com/users", headers=headers)
    assert response.status_code == 200, f"Failed to list users: {response.text}"

    users = response.json().get("users", [])
    
    found_user = None
    for u in users:
        if u.get("id") == user_id or u.get("external_id") == expected_external_id:
            found_user = u
            break

    assert found_user is not None, f"User with ID {user_id} or external_id {expected_external_id} not found in MagicBell."

    assert found_user.get("email") == expected_email, f"Expected user email to be {expected_email}, got {found_user.get('email')}"
    
    custom_attributes = found_user.get("custom_attributes", {})
    assert custom_attributes.get("language") == "es", f"Expected user custom_attributes to have 'language': 'es', got {custom_attributes}"
