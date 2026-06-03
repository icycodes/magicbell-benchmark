import os
import json
import subprocess
import pytest
import time

def test_initial_state():
    run_id = os.environ.get("ZEALT_RUN_ID")
    base_email = os.environ.get("MAGICBELL_EMAIL")
    assert run_id, "ZEALT_RUN_ID not set"
    assert base_email, "MAGICBELL_EMAIL not set"
    
    target_email = f"{base_email}+{run_id}@gmail.com"
    
    # Login with CLI
    subprocess.run([
        "magicbell", "login", "--manual",
        "--email", base_email,
        "--jwt", os.environ.get("MAGICBELL_PROJECT_TOKEN"),
        "--api-key", os.environ.get("MAGICBELL_API_KEY"),
        "--secret-key", os.environ.get("MAGICBELL_SECRET_KEY")
    ], check=True)
    
    # Send 2 broadcasts
    for i in range(2):
        data = json.dumps({
            "title": f"Initial Notification {i+1}",
            "content": "Please read this.",
            "recipients": [{"email": target_email}]
        })
        subprocess.run(["magicbell", "broadcast", "create", "--data", data], check=True)
        time.sleep(1)

    assert os.path.isdir("/home/user/magicbell-task"), "Project directory does not exist"
