import os
import subprocess
import pytest

PROJECT_DIR = "/home/user/magicbell-go-delete-user"

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_go_installed():
    import shutil
    assert shutil.which("go") is not None, "go binary not found in PATH."

def test_magicbell_cli_installed():
    import shutil
    assert shutil.which("magicbell") is not None, "magicbell CLI not found in PATH."

def test_magicbell_user_exists():
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
    
    # Check if the user exists, if not, create it
    # We use the magicbell CLI to create the user to ensure it exists for the task
    try:
        subprocess.run(
            ["magicbell", "user", "get", "--email", target_email],
            check=True,
            capture_output=True,
            text=True
        )
    except subprocess.CalledProcessError:
        # User doesn't exist, create it
        create_result = subprocess.run(
            [
                "magicbell", "user", "save",
                "--data", f'{{"email":"{target_email}","first_name":"Test","last_name":"User"}}'
            ],
            check=False,
            capture_output=True,
            text=True
        )
        assert create_result.returncode == 0, f"Failed to create user: {create_result.stderr}"
    
    # Verify the user exists now
    verify_result = subprocess.run(
        ["magicbell", "user", "get", "--email", target_email],
        check=False,
        capture_output=True,
        text=True
    )
    assert verify_result.returncode == 0, f"User {target_email} does not exist in MagicBell project."
