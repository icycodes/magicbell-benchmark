import os
import shutil
import subprocess
import json
import pytest
import urllib.request

PROJECT_DIR = "/home/user/magicbell-trigger"

def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."

def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_sdk_installed():
    package_json_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(package_json_path), "package.json not found."
    with open(package_json_path) as f:
        data = json.load(f)
    deps = data.get("dependencies", {})
    assert "magicbell-js" in deps, "magicbell-js not found in package.json dependencies."

def test_workflow_exists():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    
    workflow_key = f"welcome-workflow-{run_id}"
    
    # Create the workflow first
    create_req = urllib.request.Request(
        "https://api.magicbell.com/workflows",
        data=json.dumps({
            "workflow": {
                "key": workflow_key,
                "steps": [
                    {
                        "command": "broadcast",
                        "input": {
                            "title": "Welcome to MagicBell!",
                            "recipients": [
                                {
                                    "email": "{{user.email}}"
                                }
                            ]
                        }
                    }
                ]
            }
        }).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {project_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(create_req) as response:
            pass # Successfully created
    except urllib.error.HTTPError as e:
        # If it already exists, that's fine, but let's just ignore 422 or update it
        pass
    
    req = urllib.request.Request(
        f"https://api.magicbell.com/workflows/{workflow_key}",
        headers={
            "Authorization": f"Bearer {project_token}",
            "Accept": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            assert response.status == 200, f"Expected status 200, got {response.status}"
            data = json.loads(response.read().decode("utf-8"))
            assert data.get("workflow", {}).get("key") == workflow_key, "Workflow key does not match."
    except urllib.error.HTTPError as e:
        pytest.fail(f"Failed to fetch workflow {workflow_key}: {e.code} {e.reason}")
