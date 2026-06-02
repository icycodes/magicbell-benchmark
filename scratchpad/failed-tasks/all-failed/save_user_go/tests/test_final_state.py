import os
import re

import pytest
import requests

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")


@pytest.fixture(scope="session")
def run_id():
    rid = os.environ.get("ZEALT_RUN_ID")
    assert rid is not None and rid.strip() != "", "ZEALT_RUN_ID environment variable is not set."
    return rid


@pytest.fixture(scope="session")
def magicbell_email():
    email = os.environ.get("MAGICBELL_EMAIL")
    assert email is not None and "@" in email, "MAGICBELL_EMAIL environment variable is not set or invalid."
    return email


@pytest.fixture(scope="session")
def magicbell_project_token():
    token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert token is not None and token.strip() != "", "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    return token


@pytest.fixture(scope="session")
def expected_identifiers(run_id, magicbell_email):
    local, _, domain = magicbell_email.partition("@")
    assert local and domain, f"MAGICBELL_EMAIL '{magicbell_email}' could not be split into local/domain parts."
    expected_email = f"{local}+save-user-go-{run_id}@{domain}"
    expected_external_id = f"user-{run_id}"
    return {
        "expected_email": expected_email,
        "expected_external_id": expected_external_id,
    }


@pytest.fixture(scope="session")
def extracted_user_id():
    assert os.path.isfile(LOG_FILE), f"Output log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        content = f.read()
    match = re.search(r"User ID:\s*([A-Za-z0-9\-]+)", content)
    assert match is not None, (
        f"Could not find a line matching 'User ID: <user_id>' in {LOG_FILE}. "
        f"Log contents: {content!r}"
    )
    user_id = match.group(1).strip()
    assert user_id, f"Extracted user id from {LOG_FILE} is empty."
    return user_id


def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file does not exist at {LOG_FILE}"


def test_log_file_contains_user_id(extracted_user_id):
    assert extracted_user_id, "User ID extracted from output.log is empty."


def test_magicbell_user_matches(extracted_user_id, magicbell_project_token, expected_identifiers):
    url = f"https://api.magicbell.com/v2/users/{extracted_user_id}"
    headers = {
        "Authorization": f"Bearer {magicbell_project_token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"Failed to fetch user {extracted_user_id} from MagicBell: "
        f"status {response.status_code}, body: {response.text}"
    )
    data = response.json()

    actual_external_id = data.get("external_id")
    assert actual_external_id == expected_identifiers["expected_external_id"], (
        f"Expected user.external_id to be '{expected_identifiers['expected_external_id']}', "
        f"but got '{actual_external_id}'."
    )

    actual_email = data.get("email")
    assert actual_email == expected_identifiers["expected_email"], (
        f"Expected user.email to be '{expected_identifiers['expected_email']}', "
        f"but got '{actual_email}'."
    )
