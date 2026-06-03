import os
import shutil
import subprocess
import json
import pytest

PROJECT_DIR = "/home/user/myproject"

def test_node_and_npm_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_directory_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."
    package_json_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(package_json_path), f"package.json not found in {PROJECT_DIR}."

def test_setup_user_topic_subscription():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."
    
    # Construct the plus format email
    parts = magicbell_email.split("@")
    assert len(parts) == 2, "MAGICBELL_EMAIL is not a valid email address."
    user_email = f"{parts[0]}+{run_id}@{parts[1]}"
    
    topic = f"test-topic-{run_id}"
    
    # Send a broadcast to the user with the specific topic to automatically subscribe them
    broadcast_data = {
        "title": "Initial Setup Broadcast",
        "content": "This broadcast sets up the initial topic subscription.",
        "topic": topic,
        "recipients": [
            {"email": user_email}
        ]
    }
    
    # Login first
    login_cmd = [
        "magicbell", "login", "--manual",
        "--email", os.environ["MAGICBELL_EMAIL"],
        "--jwt", os.environ["MAGICBELL_PROJECT_TOKEN"],
        "--api-key", os.environ["MAGICBELL_API_KEY"],
        "--secret-key", os.environ["MAGICBELL_SECRET_KEY"]
    ]
    login_res = subprocess.run(login_cmd, capture_output=True, text=True)
    assert login_res.returncode == 0, f"Failed to login to magicbell cli. Error: {login_res.stderr}"
    
    cmd = [
        "magicbell", "broadcast", "create",
        "--data", json.dumps(broadcast_data)
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    assert result.returncode == 0, f"Failed to setup initial topic subscription. Error: {result.stderr}"
