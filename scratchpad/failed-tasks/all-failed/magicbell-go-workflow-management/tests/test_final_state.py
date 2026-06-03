import os
import subprocess
import requests

PROJECT_DIR = "/home/user/magicbell-go"

def get_run_id():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    return run_id

def test_workflow_management():
    run_id = get_run_id()
    workflow_key = f"test-workflow-{run_id}"
    token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # 1. Create Workflow
    result_create = subprocess.run(
        ["go", "run", "main.go", "create"],
        capture_output=True,
        text=True,
        cwd=PROJECT_DIR
    )
    assert result_create.returncode == 0, f"'go run main.go create' failed: {result_create.stderr}"
    assert f"Created workflow: {workflow_key}" in result_create.stdout, \
        f"Expected 'Created workflow: {workflow_key}' in stdout, got: {result_create.stdout}"

    # Verify in MagicBell API
    api_url = f"https://api.magicbell.com/workflows/{workflow_key}"
    response_create = requests.get(api_url, headers=headers)
    assert response_create.status_code == 200, \
        f"Expected MagicBell API to return 200 OK for created workflow, got {response_create.status_code}: {response_create.text}"
    
    workflow_data = response_create.json().get("workflow", {})
    steps = workflow_data.get("steps", [])
    assert len(steps) > 0, "Workflow must contain at least one step."
    
    # Check if MAGICBELL_EMAIL is used in the recipients
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."
    
    email_found = False
    for step in steps:
        input_data = step.get("input", {})
        recipients = input_data.get("recipients", [])
        for recipient in recipients:
            email = recipient.get("email", "")
            if magicbell_email in email and "+" in email and email.endswith("@gmail.com"):
                email_found = True
                break
        if email_found:
            break
            
    assert email_found, f"Expected recipient email to use plus format of {magicbell_email} (e.g. {magicbell_email}+<id>@gmail.com), but it was not found in the workflow steps."

    # 2. Fetch Workflow
    result_fetch = subprocess.run(
        ["go", "run", "main.go", "fetch"],
        capture_output=True,
        text=True,
        cwd=PROJECT_DIR
    )
    assert result_fetch.returncode == 0, f"'go run main.go fetch' failed: {result_fetch.stderr}"
    assert f"Fetched workflow: {workflow_key}" in result_fetch.stdout, \
        f"Expected 'Fetched workflow: {workflow_key}' in stdout, got: {result_fetch.stdout}"

    # 3. Delete Workflow
    result_delete = subprocess.run(
        ["go", "run", "main.go", "delete"],
        capture_output=True,
        text=True,
        cwd=PROJECT_DIR
    )
    assert result_delete.returncode == 0, f"'go run main.go delete' failed: {result_delete.stderr}"
    assert f"Deleted workflow: {workflow_key}" in result_delete.stdout, \
        f"Expected 'Deleted workflow: {workflow_key}' in stdout, got: {result_delete.stdout}"

    # Verify in MagicBell API
    response_delete = requests.get(api_url, headers=headers)
    assert response_delete.status_code == 404, \
        f"Expected MagicBell API to return 404 Not Found for deleted workflow, got {response_delete.status_code}: {response_delete.text}"
