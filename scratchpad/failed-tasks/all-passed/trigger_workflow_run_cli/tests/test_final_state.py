import os
import re

import requests

OUTPUT_LOG = "/home/user/magicbell-task/output.log"
RUN_ID_PATTERN = re.compile(r"Workflow Run ID:\s*([A-Za-z0-9_\-]+)")
MAGICBELL_API_BASE = "https://api.magicbell.com"


def _get_zealt_run_id():
    run_id = os.environ.get("ZEALT_RUN_ID", "").strip()
    assert run_id, "ZEALT_RUN_ID environment variable is missing or empty."
    return run_id


def _get_project_token():
    token = os.environ.get("MAGICBELL_PROJECT_TOKEN", "").strip()
    assert token, "MAGICBELL_PROJECT_TOKEN environment variable is missing or empty."
    return token


def _read_workflow_run_id():
    assert os.path.isfile(OUTPUT_LOG), f"Output log file not found at {OUTPUT_LOG}"
    with open(OUTPUT_LOG, "r") as f:
        content = f.read()
    match = RUN_ID_PATTERN.search(content)
    assert match, (
        f"Output log {OUTPUT_LOG} does not contain a line matching "
        f"'Workflow Run ID: <run_id>'. Content was: {content!r}"
    )
    run_id = match.group(1).strip()
    assert run_id, "Captured workflow Run ID from output.log is empty."
    return run_id


def _expected_workflow_key():
    return f"wf-trigger-cli-{_get_zealt_run_id()}"


def _expected_marker():
    return f"trigger-cli-{_get_zealt_run_id()}"


def _extract_key(payload):
    """Best-effort extraction of a workflow key from a run-shaped JSON object."""
    if not isinstance(payload, dict):
        return None
    for k in ("key", "workflow_key", "workflowKey"):
        v = payload.get(k)
        if isinstance(v, str) and v:
            return v
    workflow = payload.get("workflow")
    if isinstance(workflow, dict):
        v = workflow.get("key")
        if isinstance(v, str) and v:
            return v
    data = payload.get("data")
    if isinstance(data, dict):
        return _extract_key(data)
    return None


def _extract_input(payload):
    """Best-effort extraction of the run input object."""
    if not isinstance(payload, dict):
        return None
    if isinstance(payload.get("input"), dict):
        return payload["input"]
    data = payload.get("data")
    if isinstance(data, dict):
        return _extract_input(data)
    return None


def test_output_log_contains_workflow_run_id():
    """Verify that output.log exists and contains a Workflow Run ID line."""
    run_id = _read_workflow_run_id()
    assert run_id, "Workflow Run ID parsed from output.log is empty."


def test_fetch_workflow_run_via_rest_api():
    """Use the MagicBell v2 REST API to confirm the workflow run was created
    and that its workflow key matches the expected wf-trigger-cli-<run-id>."""
    project_token = _get_project_token()
    run_id = _read_workflow_run_id()
    expected_key = _expected_workflow_key()
    expected_marker = _expected_marker()

    url = f"{MAGICBELL_API_BASE}/v2/workflows/runs/{run_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }

    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"MagicBell fetch workflow run API returned status "
        f"{response.status_code}: {response.text}"
    )

    body = response.json()
    actual_key = _extract_key(body)
    assert actual_key == expected_key, (
        f"Workflow run key mismatch. Expected '{expected_key}', got "
        f"'{actual_key}'. Full body: {body!r}"
    )

    # Optional: assert marker in run input if the response exposes it.
    run_input = _extract_input(body)
    if isinstance(run_input, dict) and "marker" in run_input:
        actual_marker = run_input.get("marker")
        assert actual_marker == expected_marker, (
            f"Workflow run input.marker mismatch. Expected '{expected_marker}',"
            f" got '{actual_marker}'. Full body: {body!r}"
        )


def test_list_workflow_runs_contains_run_id():
    """List runs for the workflow key and assert the captured run_id is present."""
    project_token = _get_project_token()
    run_id = _read_workflow_run_id()
    expected_key = _expected_workflow_key()

    url = f"{MAGICBELL_API_BASE}/v2/workflows/{expected_key}/runs"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }

    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"MagicBell list workflow runs API returned status "
        f"{response.status_code}: {response.text}"
    )

    body = response.json()
    runs = body.get("data")
    assert isinstance(runs, list), (
        f"Expected 'data' array in list-runs response, got: {body!r}"
    )

    ids = []
    for run in runs:
        if isinstance(run, dict) and isinstance(run.get("id"), str):
            ids.append(run["id"])

    assert run_id in ids, (
        f"Expected run id '{run_id}' to appear in list of runs for workflow "
        f"'{expected_key}'. Run ids returned: {ids!r}"
    )
