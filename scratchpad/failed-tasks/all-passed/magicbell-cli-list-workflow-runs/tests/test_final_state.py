import os
import subprocess
import pytest

PROJECT_DIR = "/home/user/myproject"

def test_list_runs_script_exists():
    script_path = os.path.join(PROJECT_DIR, "list_runs.sh")
    assert os.path.isfile(script_path), f"Script {script_path} does not exist."

def test_list_runs_execution():
    run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    workflow_key = f"test-workflow-{run_id}"
    
    result = subprocess.run(
        ["bash", "list_runs.sh", workflow_key],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    
    assert result.returncode == 0, f"Script execution failed with error: {result.stderr}\nStdout: {result.stdout}"
    
    # Check that stdout contains a JSON array or a valid response indicating runs
    stdout_stripped = result.stdout.strip()
    assert stdout_stripped != "", "Expected stdout to not be empty."
    assert "[" in stdout_stripped and "]" in stdout_stripped, f"Expected JSON array in output, got: {stdout_stripped}"
