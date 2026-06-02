import os
import re

import pytest
import requests

PROJECT_DIR = "/home/user/magicbell-task"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")
MAGICBELL_API_BASE = "https://api.magicbell.com"


def _read_log():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        return f.read()


def _expected_key():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    return run_id, f"wf-save-cli-{run_id}"


def test_log_file_contains_workflow_key():
    run_id, expected_key = _expected_key()
    content = _read_log()
    pattern = rf"Workflow Key:\s*{re.escape(expected_key)}\b"
    assert re.search(pattern, content), (
        f"Expected log file to contain 'Workflow Key: {expected_key}'. "
        f"Got: {content!r}"
    )


def test_workflow_exists_via_magicbell_api():
    run_id, expected_key = _expected_key()
    token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."

    url = f"{MAGICBELL_API_BASE}/v2/workflows/{expected_key}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"GET {url} returned status {response.status_code}: {response.text}"
    )

    payload = response.json()
    assert payload.get("key") == expected_key, (
        f"Workflow key mismatch. Expected {expected_key}, got {payload.get('key')!r}. "
        f"Payload: {payload}"
    )

    steps = payload.get("steps")
    assert isinstance(steps, list) and len(steps) == 1, (
        f"Expected exactly one workflow step, got: {steps!r}"
    )

    step = steps[0]
    assert step.get("command") == "broadcast", (
        f"Expected step command to be 'broadcast', got: {step.get('command')!r}"
    )

    step_input = step.get("input") or {}
    title = step_input.get("title", "")
    assert run_id in str(title), (
        f"Expected step input title to contain run-id '{run_id}', got: {title!r}"
    )
