import os
import requests
import pytest

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."

def test_log_file_content():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id is not None, "ZEALT_RUN_ID environment variable is not set."
    
    expected_email = f"user-{run_id}@example.com"
    expected_line = f"User Email: {expected_email}"
    
    with open(LOG_FILE, "r") as f:
        content = f.read()
        
    assert expected_line in content, f"Expected '{expected_line}' in {LOG_FILE}, but it was not found."

def test_magicbell_user_exists_and_matches():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id is not None, "ZEALT_RUN_ID environment variable is not set."
    
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token is not None, "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    
    external_id = f"user-{run_id}"
    expected_email = f"user-{run_id}@example.com"
    expected_first_name = f"John-{run_id}"
    expected_last_name = f"Doe-{run_id}"
    
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json"
    }
    
    # Try fetching the user by external_id
    url = f"https://api.magicbell.com/v2/users/external_id:{external_id}"
    response = requests.get(url, headers=headers)
    
    # If direct fetch fails with 404, fallback to listing and filtering
    if response.status_code != 200:
        list_url = "https://api.magicbell.com/v2/users"
        list_response = requests.get(list_url, headers=headers)
        assert list_response.status_code == 200, f"Failed to fetch users list: {list_response.text}"
        
        users_data = list_response.json()
        users_list = users_data.get("data", users_data.get("users", []))
        
        user_info = None
        for u in users_list:
            if u.get("external_id") == external_id:
                user_info = u
                break
        
        assert user_info is not None, f"User with external_id {external_id} not found in the users list."
    else:
        res_json = response.json()
        user_info = res_json.get("user", res_json.get("data", res_json))
        
    # Verify user details
    assert user_info.get("email") == expected_email, f"Expected email {expected_email}, got {user_info.get('email')}"
    assert user_info.get("first_name") == expected_first_name, f"Expected first name {expected_first_name}, got {user_info.get('first_name')}"
    assert user_info.get("last_name") == expected_last_name, f"Expected last name {expected_last_name}, got {user_info.get('last_name')}"
    
    custom_attributes = user_info.get("custom_attributes", {})
    assert custom_attributes.get("role") == "admin", f"Expected role 'admin', got {custom_attributes.get('role')}"
    assert custom_attributes.get("run_id") == run_id, f"Expected run_id '{run_id}', got {custom_attributes.get('run_id')}"
