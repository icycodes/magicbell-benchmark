import os
import subprocess
import re
import pytest

PROJECT_DIR = "/home/user/task"

def test_output_log_exists_and_contains_status():
    log_path = os.path.join(PROJECT_DIR, "output.log")
    assert os.path.isfile(log_path), f"Log file {log_path} does not exist."
    
    with open(log_path, "r") as f:
        content = f.read()
    
    match = re.search(r"Status:\s*(200|204)", content)
    assert match is not None, f"Expected 'Status: 200' or 'Status: 204' in {log_path}, got: {content}"

def test_workflow_deleted_via_cli():
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
    
    cmd = [
        "magicbell", "workflow", "fetch",
        "--workflow_key", workflow_key
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    assert result.returncode != 0, f"Expected 'magicbell workflow fetch' to fail, but it succeeded for workflow_key: {workflow_key}"
    assert "404" in result.stderr or "not found" in result.stderr.lower() or "404" in result.stdout or "not found" in result.stdout.lower(), \
        f"Expected a 404 Not Found error for deleted workflow, got stderr: {result.stderr} stdout: {result.stdout}"
