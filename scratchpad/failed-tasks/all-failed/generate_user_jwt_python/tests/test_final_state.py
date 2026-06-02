import os
import re
import time

import jwt as pyjwt
import pytest
import requests

LOG_FILE = "/home/user/myproject/output.log"
MAGICBELL_API_BASE = "https://api.magicbell.com"


def _read_run_id():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    return run_id


def _split_email():
    email = os.environ.get("MAGICBELL_EMAIL")
    assert email and "@" in email, (
        "MAGICBELL_EMAIL environment variable is missing or malformed."
    )
    local, domain = email.split("@", 1)
    return local, domain


def _expected_identifiers():
    run_id = _read_run_id()
    local, domain = _split_email()
    return (
        f"user-jwt-python-{run_id}",
        f"{local}+jwt-python-{run_id}@{domain}",
        run_id,
    )


@pytest.fixture(scope="session")
def captured_token():
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."
    with open(LOG_FILE) as f:
        content = f.read()
    match = re.search(r"User JWT:\s*([A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+)", content)
    assert match, (
        f"Log file {LOG_FILE} does not contain a line matching "
        f"'User JWT: <jwt>'. Contents:\n{content}"
    )
    return match.group(1)


def test_log_file_contains_user_jwt(captured_token):
    assert captured_token, "Captured JWT token is empty."
    assert captured_token.count(".") == 2, (
        f"Captured token does not look like a JWT (expected 3 dot-separated segments): {captured_token}"
    )


def test_jwt_decodes_with_secret_key_and_has_expected_payload(captured_token):
    secret = os.environ.get("MAGICBELL_SECRET_KEY")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    assert secret, "MAGICBELL_SECRET_KEY environment variable is not set."
    assert api_key, "MAGICBELL_API_KEY environment variable is not set."

    expected_external_id, expected_email, _ = _expected_identifiers()

    try:
        payload = pyjwt.decode(
            captured_token,
            secret,
            algorithms=["HS256"],
        )
    except pyjwt.InvalidTokenError as exc:
        pytest.fail(f"User JWT failed HS256 verification with MAGICBELL_SECRET_KEY: {exc}")

    assert payload.get("user_email") == expected_email, (
        f"Expected user_email '{expected_email}', got '{payload.get('user_email')}'."
    )
    assert payload.get("user_external_id") == expected_external_id, (
        f"Expected user_external_id '{expected_external_id}', got '{payload.get('user_external_id')}'."
    )
    assert payload.get("api_key") == api_key, (
        "Expected api_key in JWT payload to equal MAGICBELL_API_KEY, "
        f"got '{payload.get('api_key')}'."
    )

    custom_keys = {k for k in payload.keys() if k not in {"exp", "iat", "nbf"}}
    expected_custom_keys = {"user_email", "user_external_id", "api_key"}
    assert custom_keys == expected_custom_keys, (
        f"JWT payload must contain exactly the custom claims {sorted(expected_custom_keys)} "
        f"(in addition to optional standard claims like exp/iat/nbf). Got custom keys: {sorted(custom_keys)}."
    )

    assert "exp" in payload, "JWT payload must include an 'exp' (expiration) claim."
    assert payload["exp"] > time.time(), "JWT 'exp' claim must be in the future."


def test_jwt_authenticates_against_user_notifications_endpoint(captured_token):
    response = requests.get(
        f"{MAGICBELL_API_BASE}/v2/notifications",
        headers={
            "Authorization": f"Bearer {captured_token}",
            "Accept": "application/json",
        },
        params={"per_page": 1},
        timeout=30,
    )
    assert response.status_code == 200, (
        f"Expected 200 from GET /v2/notifications when authenticated with the User JWT, "
        f"got {response.status_code}: {response.text}"
    )
    body = response.json()
    assert "notifications" in body, (
        f"Expected 'notifications' key in user notifications response, got: {body}"
    )
    assert isinstance(body["notifications"], list), (
        f"Expected 'notifications' to be a list, got: {type(body['notifications']).__name__}"
    )


def test_magicbell_user_was_upserted():
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."

    expected_external_id, expected_email, _ = _expected_identifiers()

    response = requests.get(
        f"{MAGICBELL_API_BASE}/v2/users",
        headers={
            "Authorization": f"Bearer {project_token}",
            "Accept": "application/json",
        },
        params={"query": expected_external_id},
        timeout=30,
    )
    assert response.status_code == 200, (
        f"Expected 200 from GET /v2/users?query={expected_external_id}, "
        f"got {response.status_code}: {response.text}"
    )
    body = response.json()
    users = body.get("data") or body.get("users") or []
    matched = [
        u for u in users if u.get("external_id") == expected_external_id
    ]
    assert matched, (
        f"No MagicBell user with external_id '{expected_external_id}' was found. Response: {body}"
    )
    user = matched[0]
    assert user.get("email") == expected_email, (
        f"Expected MagicBell user email '{expected_email}', got '{user.get('email')}'."
    )
