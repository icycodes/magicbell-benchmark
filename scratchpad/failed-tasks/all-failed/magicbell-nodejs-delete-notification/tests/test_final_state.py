import os
import re
import subprocess
import requests
import pytest

PROJECT_DIR = "/home/user/magicbell-project"

def test_delete_notification_script():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is missing."

    script_path = os.path.join(PROJECT_DIR, "delete_notification.js")
    assert os.path.isfile(script_path), f"Script {script_path} does not exist."

    output_log = os.path.join(PROJECT_DIR, "output.log")
    
    # Run the script
    with open(output_log, "w") as f:
        result = subprocess.run(
            ["node", "delete_notification.js"],
            cwd=PROJECT_DIR,
            stdout=f,
            stderr=subprocess.STDOUT,
            text=True
        )
    
    assert result.returncode == 0, f"Script execution failed. Check {output_log} for details."

    with open(output_log, "r") as f:
        output_content = f.read()

    # Parse 'Deleted Notification ID: <id>'
    match = re.search(r"Deleted Notification ID:\s*([a-zA-Z0-9\-]+)", output_content)
    assert match is not None, f"Could not find 'Deleted Notification ID: <id>' in output.log. Output was: {output_content}"

    notification_id = match.group(1)

    # Verify the notification is deleted via MagicBell API
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is missing."

    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json"
    }

    response = requests.get(
        f"https://api.magicbell.com/notifications/{notification_id}",
        headers=headers
    )

    # If deleted, it should return 404
    assert response.status_code == 404, f"Expected notification {notification_id} to be deleted (404), but got status {response.status_code}. Response: {response.text}"
