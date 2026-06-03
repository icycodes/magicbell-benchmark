import os
import subprocess
import pytest
import json

PROJECT_DIR = "/home/user/task"

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_magicbell_js_installed():
    package_json_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(package_json_path), "package.json not found."
    with open(package_json_path) as f:
        data = json.load(f)
    assert "magicbell-js" in data.get("dependencies", {}), "magicbell-js is not in dependencies."

def test_workflow_exists():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    workflow_key = f"test-workflow-{run_id}"
    
    login_cmd = [
        "magicbell", "login", "--manual",
        "--email", os.environ.get("MAGICBELL_EMAIL", ""),
        "--jwt", os.environ.get("MAGICBELL_PROJECT_TOKEN", ""),
        "--api-key", os.environ.get("MAGICBELL_API_KEY", ""),
        "--secret-key", os.environ.get("MAGICBELL_SECRET_KEY", "")
    ]
    subprocess.run(login_cmd, capture_output=True, text=True)
    
    # We create the workflow here to ensure it exists before the task starts,
    # as dynamic resources cannot be created during Docker build.
    cmd = [
        "magicbell", "workflow", "save",
        "--data", json.dumps({
            "key": workflow_key,
            "steps": [{"command": "broadcast", "input": {"title": "Test"}}]
        })
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    assert result.returncode == 0, f"Failed to create initial workflow: {result.stderr}"
    
    # Verify it was created
    fetch_cmd = [
        "magicbell", "workflow", "fetch",
        "--workflow_key", workflow_key
    ]
    fetch_result = subprocess.run(fetch_cmd, capture_output=True, text=True)
    assert fetch_result.returncode == 0, f"Workflow {workflow_key} does not exist after creation."
