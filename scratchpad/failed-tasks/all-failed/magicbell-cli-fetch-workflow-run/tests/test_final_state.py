import os
import subprocess
import json
import pytest

PROJECT_DIR = "/home/user/magicbell-task"

@pytest.fixture(scope="session")
def setup_workflow_run():
    run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    workflow_key = f"test-workflow-{run_id}"

    # 0. Login to MagicBell CLI
    login_result = subprocess.run(
        [
            "magicbell", "login", "--manual",
            "--email", os.environ.get("MAGICBELL_EMAIL", ""),
            "--jwt", os.environ.get("MAGICBELL_PROJECT_TOKEN", ""),
            "--api-key", os.environ.get("MAGICBELL_API_KEY", ""),
            "--secret-key", os.environ.get("MAGICBELL_SECRET_KEY", "")
        ],
        capture_output=True, text=True
    )
    assert login_result.returncode == 0, f"Failed to login: {login_result.stderr}"

    # 1. Save workflow
    workflow_data = json.dumps({
        "key": workflow_key,
        "steps": [{"command": "broadcast", "input": {"title": "Test", "content": "Test"}}]
    })
    save_result = subprocess.run(
        ["magicbell", "workflow", "save", "--data", workflow_data],
        capture_output=True, text=True
    )
    assert save_result.returncode == 0, f"Failed to save workflow: {save_result.stderr}"

    # 2. Create run
    run_data = json.dumps({"workflow_key": workflow_key})
    create_result = subprocess.run(
        ["magicbell", "workflow", "create_run", "--data", run_data],
        capture_output=True, text=True
    )
    assert create_result.returncode == 0, f"Failed to create workflow run: {create_result.stderr}"

    # Parse the output to extract id
    try:
        run_obj = json.loads(create_result.stdout)
        target_run_id = run_obj.get("id") or run_obj.get("workflow_run", {}).get("id")
        if not target_run_id:
            pytest.fail(f"Could not find 'id' in output: {create_result.stdout}")
    except json.JSONDecodeError:
        pytest.fail(f"Failed to parse create_run output as JSON: {create_result.stdout}")

    # Clean up output file
    output_file = os.path.join(PROJECT_DIR, f"run_details_{run_id}.json")
    if os.path.exists(output_file):
        os.remove(output_file)

    return {"run_id": run_id, "target_run_id": target_run_id, "output_file": output_file}

def test_fetch_run_script_execution(setup_workflow_run):
    target_run_id = setup_workflow_run["target_run_id"]
    script_path = os.path.join(PROJECT_DIR, "fetch_run.sh")
    
    assert os.path.isfile(script_path), f"Script {script_path} does not exist."

    result = subprocess.run(
        ["bash", "fetch_run.sh", target_run_id],
        cwd=PROJECT_DIR,
        capture_output=True, text=True
    )
    assert result.returncode == 0, f"fetch_run.sh failed: {result.stderr}\\n{result.stdout}"

def test_output_file_contents(setup_workflow_run):
    target_run_id = setup_workflow_run["target_run_id"]
    output_file = setup_workflow_run["output_file"]

    assert os.path.isfile(output_file), f"Output file {output_file} does not exist."

    with open(output_file, "r") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            pytest.fail(f"File {output_file} is not valid JSON.")
    
    fetched_id = data.get("id") or data.get("workflow_run", {}).get("id")
    assert fetched_id == target_run_id, f"Expected run ID {target_run_id}, but got {fetched_id} in {data}"
