import os
import re
import jwt
import requests
import pytest

def test_output_log_exists():
    log_path = "/home/user/magicbell-task/output.log"
    assert os.path.isfile(log_path), f"Log file {log_path} does not exist."

def test_notification_counts():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is missing."
    
    base_email = os.environ.get("MAGICBELL_EMAIL")
    assert base_email, "MAGICBELL_EMAIL environment variable is missing."
    
    api_key = os.environ.get("MAGICBELL_API_KEY")
    assert api_key, "MAGICBELL_API_KEY environment variable is missing."
    
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    assert secret_key, "MAGICBELL_SECRET_KEY environment variable is missing."
    
    # Construct user email
    user_email = f"{base_email}+{run_id}@gmail.com"
    
    # Generate User JWT
    payload = {
        "user_email": user_email,
        "api_key": api_key
    }
    user_jwt = jwt.encode(payload, secret_key, algorithm="HS256")
    
    # Fetch notifications via MagicBell API
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "X-MAGICBELL-API-KEY": api_key
    }
    response = requests.get("https://api.magicbell.com/notifications", headers=headers)
    assert response.status_code == 200, f"Failed to fetch notifications: {response.text}"
    
    data = response.json()
    notifications = data.get("notifications", [])
    
    expected_read = sum(1 for n in notifications if n.get("read_at") is not None)
    expected_unread = sum(1 for n in notifications if n.get("read_at") is None)
    
    # Read output log
    log_path = "/home/user/magicbell-task/output.log"
    with open(log_path, "r") as f:
        content = f.read()
    
    # Check Read count
    read_match = re.search(r"Read:\s*(\d+)", content)
    assert read_match, "Could not find 'Read: <count>' in output.log"
    actual_read = int(read_match.group(1))
    assert actual_read == expected_read, f"Expected {expected_read} read notifications, but got {actual_read}"
    
    # Check Unread count
    unread_match = re.search(r"Unread:\s*(\d+)", content)
    assert unread_match, "Could not find 'Unread: <count>' in output.log"
    actual_unread = int(unread_match.group(1))
    assert actual_unread == expected_unread, f"Expected {expected_unread} unread notifications, but got {actual_unread}"
