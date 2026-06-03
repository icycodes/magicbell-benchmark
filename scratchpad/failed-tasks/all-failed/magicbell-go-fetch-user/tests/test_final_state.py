import os
import subprocess
import requests
import pytest

PROJECT_DIR = "/home/user/go-task"

def test_fetch_user():
    run_id = os.environ.get("ZEALT_RUN_ID", "default")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    base_email = os.environ.get("MAGICBELL_EMAIL")
    
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable not set."
    assert base_email, "MAGICBELL_EMAIL environment variable not set."
    
    external_id = f"test-user-{run_id}"
    email = f"{base_email}+{run_id}@gmail.com"
    
    # 1. Create the user using MagicBell API
    url = "https://api.magicbell.com/users"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "user": {
            "external_id": external_id,
            "email": email
        }
    }
    resp = requests.put(url, headers=headers, json=payload)
    assert resp.status_code in (200, 201), f"Failed to create user: {resp.text}"
    
    # 2. Run go mod tidy
    tidy_result = subprocess.run(["go", "mod", "tidy"], cwd=PROJECT_DIR, capture_output=True, text=True)
    assert tidy_result.returncode == 0, f"'go mod tidy' failed: {tidy_result.stderr}"
    
    # 3. Run the CLI command
    cmd = ["go", "run", "main.go", "--external-id", external_id]
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_DIR)
    
    assert result.returncode == 0, f"'go run main.go' failed: {result.stderr}"
    assert email in result.stdout, f"Expected email {email} in stdout, got: {result.stdout}"
