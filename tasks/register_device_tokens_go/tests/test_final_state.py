import os
import re
import pytest
import requests

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

def test_project_and_log_exist():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."

def test_tokens_registered_correctly():
    # Read output.log
    with open(LOG_FILE, "r") as f:
        content = f.read()

    web_push_match = re.search(r"Web Push Token ID:\s*([^\s\n]+)", content)
    apns_match = re.search(r"APNs Token ID:\s*([^\s\n]+)", content)

    assert web_push_match, "Could not find 'Web Push Token ID' in output.log."
    assert apns_match, "Could not find 'APNs Token ID' in output.log."

    web_push_id = web_push_match.group(1)
    apns_id = apns_match.group(1)

    run_id = os.environ.get("ZEALT_RUN_ID")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    user_email = f"user-{run_id}@example.com"

    headers = {
        "Authorization": f"Bearer {project_token}",
        "X-MAGICBELL-API-KEY": api_key,
        "Accept": "application/json",
    }

    # 1. Verify Web Push Token
    web_push_url = f"https://api.magicbell.com/v2/users/{user_email}/channels/web_push/tokens"
    response = requests.get(web_push_url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch Web Push tokens: {response.text}"
    
    tokens_data = response.json().get("data", [])
    found_web_push = False
    expected_endpoint = f"https://updates.push.services.mozilla.com/wpush/v2/gAAAAAB-{run_id}"
    for token in tokens_data:
        if token.get("id") == web_push_id:
            found_web_push = True
            assert token.get("endpoint") == expected_endpoint, f"Expected endpoint {expected_endpoint}, got {token.get('endpoint')}"
            break
    assert found_web_push, f"Web Push Token ID {web_push_id} not found in user's registered tokens."

    # 2. Verify APNs Token
    apns_url = f"https://api.magicbell.com/v2/users/{user_email}/channels/mobile_push/apns/tokens"
    response = requests.get(apns_url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch APNs tokens: {response.text}"
    
    apns_tokens_data = response.json().get("data", [])
    found_apns = False
    
    # Construct expected 64-character hex token
    base_token = "1111111111111111111111111111111111111111111111111111111111111111"
    expected_device_token = base_token[:-len(run_id)] + run_id

    for token in apns_tokens_data:
        if token.get("id") == apns_id:
            found_apns = True
            assert token.get("device_token") == expected_device_token, f"Expected device token {expected_device_token}, got {token.get('device_token')}"
            break
    assert found_apns, f"APNs Token ID {apns_id} not found in user's registered tokens."
