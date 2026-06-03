import os
import requests
import pytest

LOG_FILE = "/home/user/magicbell-go-device-tokens/output.log"

def test_log_file_contains_success_message():
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id, "ZEALT_RUN_ID environment variable is not set"
    
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"
    
    with open(LOG_FILE, "r") as f:
        content = f.read()
        
    expected_message = f"Successfully registered web push token: web_push_token_{run_id}"
    assert expected_message in content, \
        f"Expected message '{expected_message}' not found in log file. Content: {content}"

def test_user_created_in_magicbell():
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN", "")
    email_base = os.environ.get("MAGICBELL_EMAIL", "")
    
    assert run_id, "ZEALT_RUN_ID environment variable is not set"
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set"
    assert email_base, "MAGICBELL_EMAIL environment variable is not set"
    
    url = f"https://api.magicbell.com/users/external_id:user_{run_id}"
    headers = {
        "Authorization": f"Bearer {project_token}"
    }
    
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, \
        f"Failed to fetch user from MagicBell API. Status code: {response.status_code}, Response: {response.text}"
    
    user_data = response.json()
    assert "user" in user_data, \
        f"Unexpected response format from MagicBell API: {user_data}"
    
    expected_email = f"{email_base}+{run_id}@gmail.com"
    actual_email = user_data["user"].get("email")
    assert actual_email == expected_email, \
        f"Expected user email to be {expected_email}, but got {actual_email}"
