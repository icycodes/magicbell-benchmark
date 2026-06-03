import os
import subprocess
import pytest
import json

PROJECT_DIR = "/home/user/app"

def test_go_application_runs_successfully():
    """Run the Go application and ensure it exits with code 0."""
    result = subprocess.run(
        ["go", "run", "main.go"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"go run main.go failed: {result.stderr}"

def test_user_timezone_updated_via_cli():
    """Use MagicBell CLI to verify the user was created/updated with the correct timezone and email."""
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "")
    magicbell_jwt = os.environ.get("MAGICBELL_PROJECT_TOKEN", "")
    magicbell_api_key = os.environ.get("MAGICBELL_API_KEY", "")
    magicbell_secret_key = os.environ.get("MAGICBELL_SECRET_KEY", "")
    
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."
    
    # Login to MagicBell CLI
    login_result = subprocess.run(
        [
            "magicbell", "login", "--manual",
            "--email", magicbell_email,
            "--jwt", magicbell_jwt,
            "--api-key", magicbell_api_key,
            "--secret-key", magicbell_secret_key
        ],
        capture_output=True,
        text=True
    )
    assert login_result.returncode == 0, f"magicbell login failed: {login_result.stderr}"
    
    # Construct the expected email
    email_parts = magicbell_email.split('@')
    assert len(email_parts) == 2, f"Invalid MAGICBELL_EMAIL format: {magicbell_email}"
    expected_email = f"{email_parts[0]}+tz-{run_id}@{email_parts[1]}"
    
    user_id = f"user-tz-{run_id}"
    
    result = subprocess.run(
        ["magicbell", "users", "get", user_id],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"magicbell users get {user_id} failed: {result.stderr}"
    
    stdout = result.stdout
    assert expected_email in stdout, f"Expected email {expected_email} not found in user details. Output: {stdout}"
    assert "America/New_York" in stdout, f"Expected timezone 'America/New_York' not found in user details. Output: {stdout}"
