import datetime
import os
import re

import jwt
import pytest
import requests


PROJECT_DIR = "/home/user/myproject"
OUTPUT_LOG = os.path.join(PROJECT_DIR, "output.log")
MAGICBELL_API_BASE = "https://api.magicbell.com/v2"

NOTIFICATION_ID_PATTERN = re.compile(r"^Notification ID:\s*(\S+)\s*$", re.MULTILINE)


def _required_env(name):
    value = os.environ.get(name, "").strip()
    assert value, f"{name} environment variable is missing or empty in verifier."
    return value


def _split_email(addr):
    assert "@" in addr, f"MAGICBELL_EMAIL is not a valid email address: {addr!r}"
    local, _, domain = addr.partition("@")
    return local, domain


def _expected_identifiers():
    run_id = _required_env("ZEALT_RUN_ID")
    base_email = _required_env("MAGICBELL_EMAIL")
    local, domain = _split_email(base_email)
    return {
        "run_id": run_id,
        "external_id": f"user-mark-read-js-{run_id}",
        "email": f"{local}+mark-read-js-{run_id}@{domain}",
        "title": f"Mark Read JS - {run_id}",
    }


def _read_notification_id():
    assert os.path.isfile(OUTPUT_LOG), f"Output log file not found at {OUTPUT_LOG}"
    with open(OUTPUT_LOG, "r", encoding="utf-8") as f:
        content = f.read()
    matches = NOTIFICATION_ID_PATTERN.findall(content)
    assert matches, (
        f"No line matching 'Notification ID: <notification_id>' found in {OUTPUT_LOG}. "
        f"Content: {content!r}"
    )
    notification_id = matches[-1].strip()
    assert notification_id, "Captured Notification ID from output.log is empty."
    return notification_id


def _mint_user_jwt(expected):
    secret = _required_env("MAGICBELL_SECRET_KEY")
    api_key = _required_env("MAGICBELL_API_KEY")
    now = datetime.datetime.now(tz=datetime.timezone.utc)
    payload = {
        "user_email": expected["email"],
        "user_external_id": expected["external_id"],
        "api_key": api_key,
        "iat": int(now.timestamp()),
        "exp": int((now + datetime.timedelta(hours=1)).timestamp()),
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    if isinstance(token, bytes):  # PyJWT < 2 compatibility
        token = token.decode("utf-8")
    return token


def _unwrap(payload, key):
    """Look for `key` at top-level, under `data`, or under `notification`."""
    if not isinstance(payload, dict):
        return None
    if key in payload:
        return payload[key]
    for wrapper in ("data", "notification", "user"):
        inner = payload.get(wrapper)
        if isinstance(inner, dict) and key in inner:
            return inner[key]
    return None


@pytest.fixture(scope="module")
def expected():
    return _expected_identifiers()


@pytest.fixture(scope="module")
def notification_id():
    return _read_notification_id()


@pytest.fixture(scope="module")
def user_jwt(expected):
    return _mint_user_jwt(expected)


def test_output_log_contains_notification_id(notification_id):
    """Verify the log file exists and contains a valid Notification ID line."""
    assert notification_id, "Notification ID parsed from output.log is empty."


def test_notification_fetch_succeeds_and_title_matches(expected, notification_id, user_jwt):
    """Fetch the notification with a fresh User JWT and assert title matches."""
    url = f"{MAGICBELL_API_BASE}/notifications/{notification_id}"
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"GET {url} with the minted User JWT returned status {response.status_code}: "
        f"{response.text[:500]}"
    )
    body = response.json()
    title = _unwrap(body, "title")
    assert title == expected["title"], (
        f"Notification title mismatch. Expected {expected['title']!r}, got {title!r}. "
        f"Full body: {body!r}"
    )


def test_notification_read_at_is_set(notification_id, user_jwt):
    """The notification must have a non-null read_at after being marked read."""
    url = f"{MAGICBELL_API_BASE}/notifications/{notification_id}"
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"GET {url} with the minted User JWT returned status {response.status_code}: "
        f"{response.text[:500]}"
    )
    body = response.json()
    read_at = _unwrap(body, "read_at")
    assert read_at is not None and str(read_at).strip() != "", (
        f"Expected notification read_at to be a non-null timestamp after mark-as-read, "
        f"got read_at={read_at!r}. Full body: {body!r}"
    )


def test_user_exists_on_project(expected):
    """Confirm the user was upserted on the project via the Project token."""
    project_token = _required_env("MAGICBELL_PROJECT_TOKEN")
    url = f"{MAGICBELL_API_BASE}/users/external_id:{expected['external_id']}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"GET {url} with the project token returned status {response.status_code}: "
        f"{response.text[:500]}"
    )
    body = response.json()
    external_id = _unwrap(body, "external_id")
    assert external_id == expected["external_id"], (
        f"Expected external_id {expected['external_id']!r} on the fetched user, "
        f"got {external_id!r}. Full body: {body!r}"
    )
