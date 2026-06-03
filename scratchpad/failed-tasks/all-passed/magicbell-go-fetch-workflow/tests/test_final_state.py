import os
import subprocess
import json
import pytest

PROJECT_DIR = "/home/user/magicbell-go-fetch-workflow"

def get_run_id():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    return run_id

@pytest.fixture(scope="session", autouse=True)
def magicbell_login():
    email = os.environ.get("MAGICBELL_EMAIL")
    jwt = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    
    assert email and jwt and api_key and secret_key, "MagicBell credentials are not set."
    
    cli_command = [
        "magicbell", "login", "--manual",
        "--email", email,
        "--jwt", jwt,
        "--api-key", api_key,
        "--secret-key", secret_key
    ]
    result = subprocess.run(cli_command, capture_output=True, text=True)
    assert result.returncode == 0, f"Failed to login via MagicBell CLI: {result.stderr}"

def test_fetch_existing_workflow():
    run_id = get_run_id()
    workflow_key = f"test-wf-{run_id}"

    # Create the workflow using MagicBell CLI
    cli_command = [
        "magicbell", "workflow", "save",
        "--data", json.dumps({
            "key": workflow_key,
            "steps": [{"command": "broadcast", "input": {"title": "Test"}}]
        })
    ]
    cli_result = subprocess.run(cli_command, capture_output=True, text=True)
    assert cli_result.returncode == 0, f"Failed to create workflow via CLI: {cli_result.stderr}"

    # Run the go script
    script_command = ["go", "run", "fetch_workflow.go", workflow_key]
    script_result = subprocess.run(script_command, cwd=PROJECT_DIR, capture_output=True, text=True)
    
    assert script_result.returncode == 0, f"Script failed with non-zero exit code: {script_result.stderr}"
    
    try:
        output_json = json.loads(script_result.stdout.strip())
    except json.JSONDecodeError:
        pytest.fail(f"Output is not valid JSON. Output: {script_result.stdout}")
    
    assert output_json.get("key") == workflow_key, f"Expected workflow key {workflow_key} in output, got: {output_json.get('key')}"

def test_fetch_non_existent_workflow():
    run_id = get_run_id()
    workflow_key = f"non-existent-wf-{run_id}"

    # Run the go script
    script_command = ["go", "run", "fetch_workflow.go", workflow_key]
    script_result = subprocess.run(script_command, cwd=PROJECT_DIR, capture_output=True, text=True)
    
    assert script_result.returncode != 0, "Expected non-zero exit code for non-existent workflow."
    assert "Workflow not found" in script_result.stdout or "Workflow not found" in script_result.stderr, \
        f"Expected 'Workflow not found' in output, got stdout: {script_result.stdout}, stderr: {script_result.stderr}"
