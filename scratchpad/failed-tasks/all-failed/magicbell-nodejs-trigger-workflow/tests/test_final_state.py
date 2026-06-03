import os
import re
import json
import urllib.request
import urllib.error
import pytest

PROJECT_DIR = "/home/user/magicbell-trigger"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

def test_log_file_exists():
    """Verify that the script was executed and output.log exists."""
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"

def test_workflow_run_created():
    """Verify the workflow run was created correctly with the right input."""
    run_id_env = os.environ.get("ZEALT_RUN_ID")
    assert run_id_env, "ZEALT_RUN_ID environment variable is not set."
    
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."
    
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    
    # Extract run ID from the log file
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    match = re.search(r"Run ID:\s*([A-Za-z0-9_-]+)", content)
    assert match, f"Could not find 'Run ID: <run_id>' in {LOG_FILE}. Content: {content}"
    
    workflow_run_id = match.group(1).strip()
    
    # Fetch the workflow run using MagicBell API
    req = urllib.request.Request(
        f"https://api.magicbell.com/workflows/runs/{workflow_run_id}",
        headers={
            "Authorization": f"Bearer {project_token}",
            "Accept": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            assert response.status == 200, f"Expected status 200, got {response.status}"
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        pytest.fail(f"Failed to fetch workflow run {workflow_run_id}: {e.code} {e.reason}")
        
    workflow_run = data.get("workflow_run", {})
    
    # Verify the workflow key
    expected_workflow_key = f"welcome-workflow-{run_id_env}"
    actual_workflow_key = workflow_run.get("workflow_key")
    assert actual_workflow_key == expected_workflow_key, \
        f"Expected workflow key '{expected_workflow_key}', got '{actual_workflow_key}'"
    
    # Verify the input email
    expected_email = f"{magicbell_email}+{run_id_env}@gmail.com"
    run_input = workflow_run.get("input", {})
    actual_email = run_input.get("user", {}).get("email")
    assert actual_email == expected_email, \
        f"Expected input.user.email '{expected_email}', got '{actual_email}'"
