import os
import subprocess
import pytest
import json

PROJECT_DIR = "/home/user/magicbell-go-list-workflows"

@pytest.fixture(scope="session", autouse=True)
def setup_test_workflow():
    """
    Log in to MagicBell CLI and create a test workflow.
    """
    # 1. Login to MagicBell CLI
    email = os.environ.get("MAGICBELL_EMAIL", "")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN", "")
    api_key = os.environ.get("MAGICBELL_API_KEY", "")
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY", "")

    login_cmd = [
        "magicbell", "login", "--manual",
        "--email", email,
        "--jwt", project_token,
        "--api-key", api_key,
        "--secret-key", secret_key
    ]
    subprocess.run(login_cmd, check=True, capture_output=True, text=True)

    # 2. Create the test workflow
    run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    workflow_key = f"test-list-workflows-{run_id}"
    
    workflow_data = {
        "key": workflow_key,
        "steps": [
            {
                "command": "broadcast",
                "input": {
                    "title": "Test Workflow"
                }
            }
        ]
    }

    save_cmd = [
        "magicbell", "workflow", "save",
        "--data", json.dumps(workflow_data)
    ]
    subprocess.run(save_cmd, check=True, capture_output=True, text=True)

    yield workflow_key

def test_go_program_lists_workflows(setup_test_workflow):
    """
    Verify that `go run main.go` lists the workflow key.
    """
    workflow_key = setup_test_workflow

    result = subprocess.run(
        ["go", "run", "main.go"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )

    assert result.returncode == 0, f"go run main.go failed: {result.stderr}"
    assert workflow_key in result.stdout, f"Expected workflow key '{workflow_key}' in output, got: {result.stdout}"
