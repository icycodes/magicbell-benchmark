import os
import subprocess
import json
import time
import jwt
import requests
import pytest

PROJECT_DIR = "/home/user/magicbell-task"

def test_fetch_notification():
    run_id = os.environ.get("ZEALT_RUN_ID", "default")
    user_external_id = f"user_{run_id}"
    email = os.environ.get("MAGICBELL_EMAIL")
    user_email = f"{email}+{user_external_id}@gmail.com"
    
    # 1. Login to MagicBell CLI
    subprocess.run(
        [
            "magicbell", "login", "--manual", 
            "--email", email, 
            "--jwt", os.environ["MAGICBELL_PROJECT_TOKEN"], 
            "--api-key", os.environ["MAGICBELL_API_KEY"], 
            "--secret-key", os.environ["MAGICBELL_SECRET_KEY"]
        ],
        check=True, capture_output=True
    )
    
    # 2. Create a broadcast
    broadcast_data = {
        "title": "Test Notification for Fetch",
        "recipients": [{"external_id": user_external_id}]
    }
    subprocess.run(
        ["magicbell", "broadcast", "create", "--data", json.dumps(broadcast_data)],
        check=True, capture_output=True, text=True
    )
    
    # 3. Generate User JWT
    payload = {
        "user_email": user_email,
        "user_external_id": user_external_id,
        "api_key": os.environ["MAGICBELL_API_KEY"]
    }
    user_jwt = jwt.encode(payload, os.environ["MAGICBELL_SECRET_KEY"], algorithm="HS256")
    
    # 4. Poll for the notification
    notification_id = None
    user_headers = {
        "Authorization": f"Bearer {user_jwt}",
        "Content-Type": "application/json"
    }
    
    for _ in range(15):
        time.sleep(2)
        resp = requests.get(
            "https://api.magicbell.com/notifications",
            headers=user_headers
        )
        if resp.status_code == 200:
            notifications = resp.json().get("notifications", [])
            for n in notifications:
                if n.get("title") == "Test Notification for Fetch":
                    notification_id = n.get("id")
                    break
        if notification_id:
            break
            
    assert notification_id is not None, "Failed to find the created notification in user inbox."
    
    # 5. Run the fetch.js script
    result = subprocess.run(
        ["node", "fetch.js", notification_id],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    
    assert result.returncode == 0, f"Script failed: {result.stderr}\nStdout: {result.stdout}"
    assert "Title: Test Notification for Fetch" in result.stdout, \
        f"Expected 'Title: Test Notification for Fetch' in stdout, got: {result.stdout}"
