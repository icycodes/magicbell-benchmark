import os
import subprocess
import requests
import pytest

PROJECT_DIR = "/home/user/magicbell-go-update-user-email"

def test_update_email_script_execution():
    run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is missing"
    
    external_id = f"test-user-{run_id}"
    new_email = f"{magicbell_email}+{run_id}@gmail.com"
    
    result = subprocess.run(
        ["go", "run", "update_email.go", external_id, new_email],
        capture_output=True,
        text=True,
        cwd=PROJECT_DIR
    )
    
    assert result.returncode == 0, f"Script execution failed: {result.stderr}"
    assert f"User updated: {new_email}" in result.stdout, f"Expected output not found in stdout: {result.stdout}"

def test_user_email_updated_in_magicbell():
    run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is missing"
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is missing"
    
    external_id = f"test-user-{run_id}"
    expected_email = f"{magicbell_email}+{run_id}@gmail.com"
    
    url = f"https://api.magicbell.com/users/external_id:{external_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch user from MagicBell API: {response.text}"
    
    user_data = response.json()
    actual_email = user_data.get("user", {}).get("email")
    assert actual_email == expected_email, f"Expected email {expected_email}, but got {actual_email}"
