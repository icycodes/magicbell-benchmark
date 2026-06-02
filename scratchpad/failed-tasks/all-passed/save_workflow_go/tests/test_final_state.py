import os
import re

import pytest
import requests


PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")


@pytest.fixture(scope="session")
def run_id():
    rid = os.environ.get("ZEALT_RUN_ID")
    assert rid, "ZEALT_RUN_ID environment variable is not set."
    return rid


@pytest.fixture(scope="session")
def magicbell_project_token():
    token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    return token


@pytest.fixture(scope="session")
def expected_workflow_key(run_id):
    return f"wf-save-go-{run_id}"


@pytest.fixture(scope="session")
def extracted_workflow_key(expected_workflow_key):
    assert os.path.isfile(LOG_FILE), f"Output log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        content = f.read()

    match = re.search(r"Workflow Key:\s*([A-Za-z0-9_\-]+)", content)
    assert match is not None, (
        f"Could not find a 'Workflow Key: <key>' line in {LOG_FILE}. "
        f"Log content was:\n{content}"
    )

    key = match.group(1).strip()
    assert key == expected_workflow_key, (
        f"Expected workflow key '{expected_workflow_key}' in {LOG_FILE}, but got '{key}'."
    )
    return key


def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file does not exist at {LOG_FILE}"


def test_log_file_contains_expected_workflow_key(extracted_workflow_key, expected_workflow_key):
    assert extracted_workflow_key == expected_workflow_key, (
        f"Expected workflow key '{expected_workflow_key}', got '{extracted_workflow_key}'."
    )


def test_workflow_exists_on_magicbell(extracted_workflow_key, magicbell_project_token, expected_workflow_key):
    url = f"https://api.magicbell.com/v2/workflows/{extracted_workflow_key}"
    headers = {
        "Authorization": f"Bearer {magicbell_project_token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"Expected 200 from GET {url}, got {response.status_code}. "
        f"Response: {response.text}"
    )

    data = response.json()
    assert data.get("key") == expected_workflow_key, (
        f"Expected workflow key '{expected_workflow_key}' in API response, got '{data.get('key')}'."
    )


def test_workflow_steps_match(extracted_workflow_key, magicbell_project_token, run_id):
    url = f"https://api.magicbell.com/v2/workflows/{extracted_workflow_key}"
    headers = {
        "Authorization": f"Bearer {magicbell_project_token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"Expected 200 from GET {url}, got {response.status_code}. Response: {response.text}"
    )

    data = response.json()
    steps = data.get("steps")
    assert isinstance(steps, list) and len(steps) == 1, (
        f"Expected exactly 1 workflow step, got: {steps!r}"
    )

    step = steps[0]
    assert step.get("command") == "broadcast", (
        f"Expected step command 'broadcast', got '{step.get('command')}'."
    )

    step_input = step.get("input") or {}
    expected_title = f"Workflow Save Go - {run_id}"
    expected_content = "Hello from Go saved workflow"
    assert step_input.get("title") == expected_title, (
        f"Expected step input title '{expected_title}', got '{step_input.get('title')}'."
    )
    assert step_input.get("content") == expected_content, (
        f"Expected step input content '{expected_content}', got '{step_input.get('content')}'."
    )
