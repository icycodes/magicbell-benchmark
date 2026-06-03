import os
import re
import requests
import jwt
import pytest

PROJECT_DIR = "/home/user/project"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"

def test_notification_archived():
    # 1. Read run-id
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."

    # 2. Extract notification ID from log file
    with open(LOG_FILE, "r") as f:
        log_content = f.read()
    
    match = re.search(r"Archived Notification ID:\s*([A-Za-z0-9_-]+)", log_content)
    assert match, "Could not find 'Archived Notification ID: <id>' in output.log."
    notification_id = match.group(1)

    # 3. Generate User JWT
    api_key = os.environ.get("MAGICBELL_API_KEY")
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    email = os.environ.get("MAGICBELL_EMAIL")
    assert api_key and secret_key and email, "Missing MagicBell API credentials."

    user_email = f"{email}+{run_id}@gmail.com"
    
    payload = {
        "user_email": user_email,
        "api_key": api_key,
    }
    user_jwt = jwt.encode(payload, secret_key, algorithm="HS256")

    # 4. Fetch the notification via API
    url = f"https://api.magicbell.com/notifications/{notification_id}"
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "Accept": "application/json"
    }
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch notification {notification_id}: {response.text}"

    data = response.json()
    notification = data.get("notification", {})
    
    # 5. Verify it is archived
    assert notification.get("archived_at") is not None, f"Notification {notification_id} is not archived."
