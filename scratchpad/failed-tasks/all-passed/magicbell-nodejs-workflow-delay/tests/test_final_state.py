import os
import subprocess
import requests
import pytest

PROJECT_DIR = "/home/user/magicbell-task"

def test_create_workflow_script_executes_successfully():
    """Verify that the create-workflow.js script executes successfully."""
    script_path = os.path.join(PROJECT_DIR, "create-workflow.js")
    assert os.path.isfile(script_path), f"Script not found at {script_path}"

    result = subprocess.run(
        ["node", "create-workflow.js"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    
    assert result.returncode == 0, f"Script execution failed with error: {result.stderr}"

def test_workflow_definition_in_magicbell():
    """Verify that the workflow was created correctly in MagicBell."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."

    workflow_key = f"workflow-delay-{run_id}"
    url = f"https://api.magicbell.com/v2/workflows/{workflow_key}"
    
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch workflow. Status: {response.status_code}, Response: {response.text}"
    
    data = response.json()
    
    # Depending on the exact API response structure, the workflow might be nested under a 'workflow' key
    workflow = data.get("workflow") or data
    
    assert workflow.get("key") == workflow_key, f"Expected workflow key to be {workflow_key}, got {workflow.get('key')}"
    
    steps = workflow.get("steps", [])
    assert len(steps) == 3, f"Expected exactly 3 steps in the workflow, got {len(steps)}"
    
    # Step 1: broadcast
    assert steps[0].get("command") == "broadcast", f"Expected step 1 command to be 'broadcast', got {steps[0].get('command')}"
    assert steps[0].get("input", {}).get("title") == "Welcome!", f"Expected step 1 input title to be 'Welcome!', got {steps[0].get('input', {}).get('title')}"
    
    # Step 2: wait
    assert steps[1].get("command") == "wait", f"Expected step 2 command to be 'wait', got {steps[1].get('command')}"
    assert steps[1].get("input", {}).get("duration") == 60, f"Expected step 2 input duration to be 60, got {steps[1].get('input', {}).get('duration')}"
    
    # Step 3: broadcast
    assert steps[2].get("command") == "broadcast", f"Expected step 3 command to be 'broadcast', got {steps[2].get('command')}"
    assert steps[2].get("input", {}).get("title") == "Follow up", f"Expected step 3 input title to be 'Follow up', got {steps[2].get('input', {}).get('title')}"
