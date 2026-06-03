import os
import time
import requests
import subprocess
import pytest

PROJECT_DIR = "/home/user/magicbell-task"

def test_mark_all_seen():
    run_id = os.environ.get("ZEALT_RUN_ID", "default")
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    assert magicbell_email, "MAGICBELL_EMAIL is not set"
    
    user_email = f"{magicbell_email}+{run_id}@gmail.com"
    
    api_key = os.environ.get("MAGICBELL_API_KEY")
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    
    assert api_key and secret_key and project_token, "MagicBell credentials are not set"
    
    # Login to CLI
    login_res = subprocess.run([
        "magicbell", "login", "--manual",
        "--email", magicbell_email,
        "--jwt", project_token,
        "--api-key", api_key,
        "--secret-key", secret_key
    ], capture_output=True, text=True)
    assert login_res.returncode == 0, f"CLI login failed: {login_res.stderr}"
    
    # 1. Send 3 notifications using CLI to ensure unseen notifications exist
    for i in range(3):
        cmd = [
            "magicbell", "broadcast", "create",
            "--data", f'{{"title": "Test Notification {i}", "recipients": [{{"email": "{user_email}"}}]}}'
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        assert res.returncode == 0, f"Failed to create broadcast: {res.stderr}"
        
    # Wait for delivery
    time.sleep(5)
    
    # Verify they are currently unseen
    headers = {
        "X-MAGICBELL-API-KEY": api_key,
        "X-MAGICBELL-USER-EMAIL": user_email
    }
    fetch_res = requests.get("https://api.magicbell.com/notifications", headers=headers)
    assert fetch_res.status_code == 200, f"Failed to fetch notifications: {fetch_res.text}"
    notifications_before = fetch_res.json().get("notifications", [])
    assert len(notifications_before) >= 3, f"Expected at least 3 notifications, got {len(notifications_before)}"
    unseen_before = [n for n in notifications_before if n.get("seen_at") is None]
    assert len(unseen_before) >= 3, "Notifications were already seen before running the script!"
    
    # 2. Run the user's Node.js script
    env = os.environ.copy()
    result = subprocess.run(["node", "index.js"], cwd=PROJECT_DIR, env=env, capture_output=True, text=True)
    assert result.returncode == 0, f"Node.js script failed to execute. Return code: {result.returncode}\nStderr: {result.stderr}\nStdout: {result.stdout}"
    
    # 3. Verify that all notifications are marked as seen
    fetch_res_after = requests.get("https://api.magicbell.com/notifications", headers=headers)
    assert fetch_res_after.status_code == 200, f"Failed to fetch notifications: {fetch_res_after.text}"
    
    notifications_after = fetch_res_after.json().get("notifications", [])
    unseen_after = [n for n in notifications_after if n.get("seen_at") is None]
    assert len(unseen_after) == 0, f"Found {len(unseen_after)} unseen notifications. They were not marked as seen by the script."
