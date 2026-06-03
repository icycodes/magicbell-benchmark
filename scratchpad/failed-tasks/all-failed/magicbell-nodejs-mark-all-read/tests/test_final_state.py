import os
import subprocess
import requests
import jwt
import time
import pytest

PROJECT_DIR = "/home/user/magicbell-task"

def test_script_exists():
    assert os.path.isfile(os.path.join(PROJECT_DIR, "index.js")), "index.js not found in project directory"

def test_script_execution():
    run_id = os.environ.get("ZEALT_RUN_ID")
    base_email = os.environ.get("MAGICBELL_EMAIL")
    assert run_id, "ZEALT_RUN_ID not set"
    assert base_email, "MAGICBELL_EMAIL not set"
    
    target_email = f"{base_email}+{run_id}@gmail.com"
    
    result = subprocess.run(
        ["node", "index.js", "--user-email", target_email],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    
    assert result.returncode == 0, f"Script failed with error: {result.stderr}"
    assert "Successfully marked all notifications as read" in result.stdout, \
        f"Expected success message in stdout, got: {result.stdout}"

def test_unread_count_is_zero():
    run_id = os.environ.get("ZEALT_RUN_ID")
    base_email = os.environ.get("MAGICBELL_EMAIL")
    target_email = f"{base_email}+{run_id}@gmail.com"
    
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    
    payload = {
        "user_email": target_email,
        "api_key": api_key,
        "exp": int(time.time()) + 3600
    }
    user_jwt = jwt.encode(payload, secret_key, algorithm="HS256")
    
    headers = {
        "X-MAGICBELL-USER-JWT": user_jwt,
        "Content-Type": "application/json"
    }
    
    resp = requests.get("https://api.magicbell.com/notifications/unread/count", headers=headers)
    if resp.status_code == 401:
        # Fallback to API KEY and USER EMAIL headers if JWT header is different
        headers = {
            "X-MAGICBELL-API-KEY": api_key,
            "X-MAGICBELL-USER-EMAIL": target_email,
            "Content-Type": "application/json"
        }
        resp = requests.get("https://api.magicbell.com/notifications/unread/count", headers=headers)
        
    assert resp.status_code == 200, f"Failed to fetch unread count: {resp.text}"
    
    data = resp.json()
    count = data.get("unread_count", -1)
    
    assert count == 0, f"Expected unread count to be 0, got {count}"
