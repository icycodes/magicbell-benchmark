import os
import subprocess
import requests
import json
import pytest

PROJECT_DIR = "/home/user/project"

def create_notification(email):
    url = "https://api.magicbell.com/notifications"
    headers = {
        "X-MAGICBELL-API-KEY": os.environ["MAGICBELL_API_KEY"],
        "X-MAGICBELL-API-SECRET": os.environ["MAGICBELL_SECRET_KEY"],
        "Content-Type": "application/json"
    }
    data = {
        "notification": {
            "title": "Test Notification for Read",
            "recipients": [{"email": email}]
        }
    }
    resp = requests.post(url, headers=headers, json=data)
    resp.raise_for_status()
    return resp.json()["notification"]["id"]

def get_notification(notification_id):
    url = f"https://api.magicbell.com/notifications/{notification_id}"
    headers = {
        "X-MAGICBELL-API-KEY": os.environ["MAGICBELL_API_KEY"],
        "X-MAGICBELL-API-SECRET": os.environ["MAGICBELL_SECRET_KEY"],
    }
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    return resp.json()["notification"]

def test_mark_read_script():
    run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    email = f"{os.environ['MAGICBELL_EMAIL']}+{run_id}@gmail.com"
    
    # 1. Create a notification
    notification_id = create_notification(email)
    
    # Verify it is initially unread
    notif = get_notification(notification_id)
    assert notif.get("read_at") is None, "Notification should be unread initially."
    
    # 2. Run the executor's script
    script_path = os.path.join(PROJECT_DIR, "index.js")
    assert os.path.isfile(script_path), f"Script {script_path} does not exist."
    
    result = subprocess.run(
        ["node", "index.js", notification_id],
        capture_output=True, text=True, cwd=PROJECT_DIR
    )
    
    assert result.returncode == 0, f"'node index.js' failed: {result.stderr}"
    assert f"Notification {notification_id} marked as read" in result.stdout, \
        f"Expected success message in stdout, got: {result.stdout}"
        
    # 3. Verify the notification is marked as read
    notif_after = get_notification(notification_id)
    assert notif_after.get("read_at") is not None, "Notification was not marked as read in MagicBell."
