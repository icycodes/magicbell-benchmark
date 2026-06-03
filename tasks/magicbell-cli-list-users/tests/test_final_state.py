import os
import subprocess
import pytest

PROJECT_DIR = "/home/user/magicbell-task"

def test_manage_users_script():
    run_id = os.environ.get("ZEALT_RUN_ID", "default")
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "test")
    expected_email = f"{magicbell_email}+{run_id}@gmail.com"
    expected_external_id = f"user-{run_id}"

    script_path = os.path.join(PROJECT_DIR, "manage_users.sh")
    assert os.path.isfile(script_path), "manage_users.sh not found in the project directory."

    # Remove users.txt if it exists from previous runs
    users_file = os.path.join(PROJECT_DIR, "users.txt")
    if os.path.isfile(users_file):
        os.remove(users_file)

    # Run the script
    result = subprocess.run(
        ["bash", "manage_users.sh"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"manage_users.sh failed with exit code {result.returncode}: {result.stderr}"

    # Check users.txt
    assert os.path.isfile(users_file), "users.txt was not created by the script."

    with open(users_file, "r") as f:
        content = f.read()

    assert expected_email in content, f"Expected email {expected_email} not found in users.txt."

    # Use MagicBell CLI to verify user exists
    cli_result = subprocess.run(
        ["magicbell", "user", "list"],
        capture_output=True,
        text=True
    )
    assert cli_result.returncode == 0, f"magicbell user list command failed: {cli_result.stderr}"
    assert expected_external_id in cli_result.stdout, f"Expected external ID {expected_external_id} not found in project users."
