import os
import re
import requests
import pytest

PROJECT_DIR = "/home/user/magicbell-task"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")
UUID_RE = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)


def _expected_email(magicbell_email: str, run_id: str) -> str:
    assert "@" in magicbell_email, (
        f"MAGICBELL_EMAIL does not contain '@': {magicbell_email}"
    )
    local, domain = magicbell_email.split("@", 1)
    return f"{local}+save-user-cli-{run_id}@{domain}"


def _read_user_id_from_log() -> str:
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        content = f.read()
    match = re.search(r"User ID:\s*(\S+)", content)
    assert match is not None, (
        f"Log file {LOG_FILE} does not contain 'User ID: <id>'. Content: {content!r}"
    )
    user_id = match.group(1).strip()
    assert UUID_RE.fullmatch(user_id), (
        f"Captured User ID is not a valid UUID: {user_id!r}"
    )
    return user_id


def test_log_file_contains_user_id():
    _read_user_id_from_log()


def test_magicbell_user_matches_expected_attributes():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."

    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set."

    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."

    user_id = _read_user_id_from_log()

    expected_external_id = f"user-{run_id}"
    expected_email = _expected_email(magicbell_email, run_id)

    url = f"https://api.magicbell.com/v2/users/{user_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"GET {url} returned {response.status_code}: {response.text}"
    )
    payload = response.json()
    actual_external_id = payload.get("external_id")
    actual_email = payload.get("email")

    assert actual_external_id == expected_external_id, (
        f"Expected external_id {expected_external_id!r}, "
        f"got {actual_external_id!r}. Full payload: {payload}"
    )
    assert actual_email == expected_email, (
        f"Expected email {expected_email!r}, got {actual_email!r}. "
        f"Full payload: {payload}"
    )
