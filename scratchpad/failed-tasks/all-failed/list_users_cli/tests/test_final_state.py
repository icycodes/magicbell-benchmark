import os
import re
import pytest
import requests

PROJECT_DIR = "/home/user/magicbell-task"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")


def _read_log():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        return f.read()


def _extract_field(content, label):
    pattern = rf"{re.escape(label)}:\s*(\S+)"
    match = re.search(pattern, content)
    assert match is not None, (
        f"Log file {LOG_FILE} does not contain '{label}: <value>'. Content: {content}"
    )
    return match.group(1).strip()


def test_log_file_contains_required_fields():
    content = _read_log()
    user_id = _extract_field(content, "User ID")
    external_id = _extract_field(content, "External ID")
    assert user_id, "User ID value is empty in the log file."
    assert external_id, "External ID value is empty in the log file."


def test_external_id_matches_run_id():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    content = _read_log()
    external_id = _extract_field(content, "External ID")
    expected = f"list-users-cli-{run_id}"
    assert external_id == expected, (
        f"Expected External ID '{expected}', got '{external_id}'."
    )


def test_user_api_matches_expected():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."

    gmail_user = os.environ.get("GMAIL_USER_NAME")
    assert gmail_user, "GMAIL_USER_NAME environment variable is not set."

    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."

    content = _read_log()
    user_id = _extract_field(content, "User ID")
    external_id = _extract_field(content, "External ID")

    expected_external_id = f"list-users-cli-{run_id}"
    expected_email = f"{gmail_user}+list-users-cli-{run_id}@gmail.com"

    url = f"https://api.magicbell.com/v2/users/{user_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"GET {url} returned status {response.status_code}: {response.text}"
    )
    payload = response.json()

    actual_external_id = payload.get("external_id")
    assert actual_external_id == expected_external_id, (
        f"Expected external_id '{expected_external_id}', got '{actual_external_id}'."
    )

    actual_email = payload.get("email")
    assert actual_email == expected_email, (
        f"Expected email '{expected_email}', got '{actual_email}'."
    )
