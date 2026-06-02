import datetime
import os
import re
import time

import jwt
import pytest
import requests

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")
MAGICBELL_BASE_URL = "https://api.magicbell.com/v2"


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
def magicbell_api_key():
    api_key = os.environ.get("MAGICBELL_API_KEY")
    assert api_key is not None and api_key.strip() != "", "MAGICBELL_API_KEY environment variable is not set."
    return api_key


@pytest.fixture(scope="session")
def magicbell_secret_key():
    secret = os.environ.get("MAGICBELL_SECRET_KEY")
    assert secret is not None and secret.strip() != "", "MAGICBELL_SECRET_KEY environment variable is not set."
    return secret


@pytest.fixture(scope="session")
def expected_identifiers(run_id, magicbell_email):
    local, _, domain = magicbell_email.partition("@")
    assert local and domain, (
        f"MAGICBELL_EMAIL '{magicbell_email}' could not be split into local/domain parts."
    )
    return {
        "expected_email": f"{local}+mark-read-go-{run_id}@{domain}",
        "expected_external_id": f"user-mark-read-go-{run_id}",
        "expected_title": f"Mark Read Go Demo - {run_id}",
    }


@pytest.fixture(scope="session")
def user_jwt(expected_identifiers, magicbell_api_key, magicbell_secret_key):
    now = datetime.datetime.now(tz=datetime.timezone.utc)
    payload = {
        "user_email": expected_identifiers["expected_email"],
        "user_external_id": expected_identifiers["expected_external_id"],
        "api_key": magicbell_api_key,
        "iat": int(now.timestamp()),
        "exp": int((now + datetime.timedelta(days=365)).timestamp()),
    }
    token = jwt.encode(payload, magicbell_secret_key, algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


@pytest.fixture(scope="session")
def extracted_notification_id():
    assert os.path.isfile(LOG_FILE), f"Output log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        content = f.read()
    match = re.search(r"Notification ID:\s*([A-Za-z0-9_\-]+)", content)
    assert match is not None, (
        f"Could not find a line matching 'Notification ID: <notification_id>' in {LOG_FILE}. "
        f"Log contents: {content!r}"
    )
    notification_id = match.group(1).strip()
    assert notification_id, f"Extracted notification id from {LOG_FILE} is empty."
    return notification_id


@pytest.fixture(scope="session")
def notification_payload(extracted_notification_id, user_jwt, magicbell_api_key):
    url = f"{MAGICBELL_BASE_URL}/notifications/{extracted_notification_id}"
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "X-MAGICBELL-API-KEY": magicbell_api_key,
        "Accept": "application/json",
    }
    last_error = None
    deadline = time.time() + 30
    while True:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            return response.json()
        last_error = (
            f"status {response.status_code}, body: {response.text}"
        )
        if time.time() >= deadline:
            break
        time.sleep(3)
    pytest.fail(
        f"Failed to fetch notification {extracted_notification_id} from MagicBell user API. "
        f"Last response: {last_error}"
    )


def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file does not exist at {LOG_FILE}"


def test_log_file_contains_notification_id(extracted_notification_id):
    assert extracted_notification_id, "Notification ID extracted from output.log is empty."


def test_notification_title_matches(notification_payload, expected_identifiers):
    actual_title = notification_payload.get("title")
    assert actual_title == expected_identifiers["expected_title"], (
        f"Expected notification.title to be '{expected_identifiers['expected_title']}', "
        f"but got '{actual_title}'."
    )


def test_notification_marked_as_read(notification_payload):
    read_at = notification_payload.get("read_at")
    assert read_at, (
        "Expected notification.read_at to be a non-null timestamp after the task marked it as read, "
        f"but got: {read_at!r}. Full payload keys: {sorted(notification_payload.keys())}"
    )
