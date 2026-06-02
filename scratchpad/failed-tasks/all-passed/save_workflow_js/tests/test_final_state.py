import os
import re
import requests


LOG_PATH = "/home/user/myproject/output.log"


def _run_id() -> str:
    run_id = os.environ.get("ZEALT_RUN_ID", "").strip()
    assert run_id, "ZEALT_RUN_ID environment variable is missing or empty."
    return run_id


def _expected_key(run_id: str) -> str:
    return f"wf-save-{run_id}"


def _read_workflow_key() -> str:
    assert os.path.isfile(LOG_PATH), f"Log file not found at {LOG_PATH}"
    with open(LOG_PATH, "r") as f:
        content = f.read()
    match = re.search(r"Workflow Key:\s*([A-Za-z0-9_\-\.]+)", content)
    assert match, (
        f"Log file content does not match pattern 'Workflow Key: <workflow_key>'. "
        f"Content: {content!r}"
    )
    return match.group(1)


def test_output_log_contains_expected_workflow_key():
    """The script must record the saved workflow key in the log file."""
    run_id = _run_id()
    workflow_key = _read_workflow_key()
    expected = _expected_key(run_id)
    assert workflow_key == expected, (
        f"Expected workflow key '{expected}' in log file, got '{workflow_key}'."
    )


def test_workflow_saved_in_magicbell():
    """Fetch the workflow from MagicBell and validate its definition."""
    run_id = _run_id()
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN", "").strip()
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is missing or empty."

    workflow_key = _read_workflow_key()
    expected_key = _expected_key(run_id)
    assert workflow_key == expected_key, (
        f"Workflow key in log ({workflow_key}) does not match expected key ({expected_key})."
    )

    url = f"https://api.magicbell.com/v2/workflows/{workflow_key}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"Failed to fetch workflow '{workflow_key}' from MagicBell. "
        f"Status: {response.status_code}, Response: {response.text}"
    )

    data = response.json()
    assert data.get("key") == expected_key, (
        f"Expected workflow key '{expected_key}' in API response, got '{data.get('key')}'."
    )

    steps = data.get("steps")
    assert isinstance(steps, list) and len(steps) >= 1, (
        f"Expected workflow to have at least one step, got: {steps!r}"
    )

    first_step = steps[0]
    assert isinstance(first_step, dict), (
        f"Expected first step to be an object, got: {first_step!r}"
    )
    assert first_step.get("command") == "broadcast", (
        f"Expected steps[0].command == 'broadcast', got '{first_step.get('command')}'."
    )

    step_input = first_step.get("input")
    assert isinstance(step_input, dict), (
        f"Expected steps[0].input to be an object, got: {step_input!r}"
    )

    title = step_input.get("title")
    assert isinstance(title, str) and title.strip(), (
        f"Expected steps[0].input.title to be a non-empty string, got: {title!r}"
    )
    assert run_id in title, (
        f"Expected steps[0].input.title to contain run-id '{run_id}', got '{title}'."
    )

    content = step_input.get("content")
    assert isinstance(content, str) and content.strip(), (
        f"Expected steps[0].input.content to be a non-empty string, got: {content!r}"
    )
