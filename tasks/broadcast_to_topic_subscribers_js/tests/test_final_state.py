import os
import re
import json
import base64
import requests
import pytest

LOG_FILE = "/home/user/magicbell-topic-broadcast/output.log"

def get_run_id():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id is not None, "ZEALT_RUN_ID environment variable is not set."
    return run_id

def decode_jwt_payload(token):
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")
    payload_b64 = parts[1]
    payload_b64 += '=' * (4 - len(payload_b64) % 4)
    payload_json = base64.urlsafe_b64decode(payload_b64).decode('utf-8')
    return json.loads(payload_json)

def parse_log():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    lines = content.strip().split("\n")
    log_data = {}
    for line in lines:
        if line.startswith("User Created:"):
            log_data["user_email"] = line.split("User Created:")[1].strip()
        elif line.startswith("User JWT Generated:"):
            log_data["user_jwt"] = line.split("User JWT Generated:")[1].strip()
        elif line.startswith("Subscribed to Topic:"):
            log_data["topic"] = line.split("Subscribed to Topic:")[1].strip()
        elif line.startswith("Broadcast Sent ID:"):
            log_data["broadcast_id"] = line.split("Broadcast Sent ID:")[1].strip()
        elif line.startswith("Notification Received Title:"):
            log_data["received_title"] = line.split("Notification Received Title:")[1].strip()
            
    return log_data

def test_log_file_exists():
    """Verify that the log file exists."""
    assert os.path.isfile(LOG_FILE), f"Log file does not exist at {LOG_FILE}"

def test_log_file_contents():
    """Verify that the log file contains all required lines with correct values."""
    run_id = get_run_id()
    log_data = parse_log()
    
    assert "user_email" in log_data, "Log file is missing 'User Created' line."
    assert log_data["user_email"] == f"user+{run_id}@gmail.com", f"Expected user email user+{run_id}@gmail.com, got {log_data['user_email']}"
    
    assert "user_jwt" in log_data, "Log file is missing 'User JWT Generated' line."
    assert len(log_data["user_jwt"]) > 0, "User JWT is empty."
    
    assert "topic" in log_data, "Log file is missing 'Subscribed to Topic' line."
    assert log_data["topic"] == f"announcements-{run_id}", f"Expected topic announcements-{run_id}, got {log_data['topic']}"
    
    assert "broadcast_id" in log_data, "Log file is missing 'Broadcast Sent ID' line."
    assert len(log_data["broadcast_id"]) > 0, "Broadcast ID is empty."
    
    assert "received_title" in log_data, "Log file is missing 'Notification Received Title' line."
    assert log_data["received_title"] == f"System Update - {run_id}", f"Expected title 'System Update - {run_id}', got '{log_data['received_title']}'"

def test_jwt_payload_contents():
    """Verify the User JWT payload structure and values."""
    run_id = get_run_id()
    api_key = os.environ.get("MAGICBELL_API_KEY")
    assert api_key is not None, "MAGICBELL_API_KEY environment variable is not set."
    
    log_data = parse_log()
    user_jwt = log_data["user_jwt"]
    
    try:
        payload = decode_jwt_payload(user_jwt)
    except Exception as e:
        pytest.fail(f"Failed to decode JWT payload: {e}")
        
    assert payload.get("user_email") == f"user+{run_id}@gmail.com", f"Expected user_email 'user+{run_id}@gmail.com', got '{payload.get('user_email')}'"
    assert payload.get("user_external_id") == f"user-{run_id}", f"Expected user_external_id 'user-{run_id}', got '{payload.get('user_external_id')}'"
    assert payload.get("api_key") == api_key, f"Expected api_key '{api_key}', got '{payload.get('api_key')}'"

def test_magicbell_broadcast_state():
    """Verify that the broadcast was successfully created with the correct topic and recipients."""
    run_id = get_run_id()
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token is not None, "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    
    log_data = parse_log()
    broadcast_id = log_data["broadcast_id"]
    
    url = f"https://api.magicbell.com/v2/broadcasts/{broadcast_id}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {project_token}"
    }
    
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch broadcast from MagicBell API. Status: {response.status_code}, Response: {response.text}"
    
    data = response.json()
    # The response may have the broadcast nested under a 'broadcast' key or directly at root
    broadcast_data = data.get("broadcast", data)
    
    assert broadcast_data.get("topic") == f"announcements-{run_id}", f"Expected topic 'announcements-{run_id}', got '{broadcast_data.get('topic')}'"
    
    recipients = broadcast_data.get("recipients", [])
    assert len(recipients) > 0, "Broadcast recipients list is empty."
    
    # Check that topic subscribers syntax is used: [{"topic": {"subscribers": true}}]
    has_topic_subscribers = False
    for recipient in recipients:
        if isinstance(recipient, dict) and "topic" in recipient:
            topic_rec = recipient["topic"]
            if isinstance(topic_rec, dict) and topic_rec.get("subscribers") is True:
                has_topic_subscribers = True
                break
                
    assert has_topic_subscribers, f"Expected topic subscription recipients syntax (i.e. 'topic': {{'subscribers': true}}), got recipients: {recipients}"

def test_magicbell_user_notification_state():
    """Verify that the notification is present in the user's notification list."""
    run_id = get_run_id()
    log_data = parse_log()
    user_jwt = log_data["user_jwt"]
    
    url = "https://api.magicbell.com/v2/notifications"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {user_jwt}"
    }
    
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch user notifications from MagicBell API. Status: {response.status_code}, Response: {response.text}"
    
    data = response.json()
    notifications = data.get("notifications", [])
    
    expected_title = f"System Update - {run_id}"
    found_notification = False
    
    for notif in notifications:
        if notif.get("title") == expected_title:
            found_notification = True
            break
            
    assert found_notification, f"Expected notification with title '{expected_title}' not found in user's notification list. Available titles: {[n.get('title') for n in notifications]}"
