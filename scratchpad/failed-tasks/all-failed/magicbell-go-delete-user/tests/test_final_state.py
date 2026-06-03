import os
import subprocess
import pytest

PROJECT_DIR = "/home/user/magicbell-go-delete-user"

def test_user_deleted_in_magicbell():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."
    
    target_email = f"{magicbell_email}+{run_id}@gmail.com"
    
    # Login to magicbell CLI
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    subprocess.run(
        ["magicbell", "login", "--manual", "--email", magicbell_email, "--jwt", project_token, "--api-key", api_key, "--secret-key", secret_key],
        check=True,
        capture_output=True,
        text=True
    )
    
    # We expect this command to fail because the user should be deleted
    result = subprocess.run(
        ["magicbell", "user", "get", "--email", target_email],
        capture_output=True,
        text=True
    )
    
    # If the user is deleted, the CLI should return a non-zero exit code
    # and likely some error message indicating not found.
    assert result.returncode != 0, f"Expected 'magicbell user get' to fail for deleted user, but it succeeded. User {target_email} still exists."
    assert "not found" in result.stderr.lower() or "404" in result.stderr or "not found" in result.stdout.lower() or "404" in result.stdout, \
        f"Expected a 'not found' or '404' error, got: stderr={result.stderr}, stdout={result.stdout}"

def test_output_log_exists_and_contains_message():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."
    
    target_email = f"{magicbell_email}+{run_id}@gmail.com"
    
    log_file = os.path.join(PROJECT_DIR, "output.log")
    assert os.path.isfile(log_file), f"Log file {log_file} does not exist."
    
    with open(log_file, "r") as f:
        content = f.read()
        
    expected_message = f"User deleted: {target_email}"
    assert expected_message in content, f"Expected '{expected_message}' in {log_file}, but got:\n{content}"
