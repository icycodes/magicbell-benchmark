import base64
import json
import os
import re
import time

import jwt
import pytest
import requests

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")
MAGICBELL_API_BASE = "https://api.magicbell.com/v2"


def _split_email(addr):
    assert "@" in addr, f"MAGICBELL_EMAIL is not a valid email address: {addr!r}"
    local, _, domain = addr.partition("@")
    return local, domain


def _expected_identifiers():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID is not set in the verifier environment."
    base_email = os.environ.get("MAGICBELL_EMAIL")
    assert base_email, "MAGICBELL_EMAIL is not set in the verifier environment."
    local, domain = _split_email(base_email)
    expected_email = f"{local}+jwt-node-{run_id}@{domain}"
    expected_external_id = f"user-jwt-node-{run_id}"
    return run_id, expected_email, expected_external_id


def _read_token_from_log():
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    matches = re.findall(r"^User JWT:\s*(\S+)\s*$", content, flags=re.MULTILINE)
    assert matches, (
        f"No line matching 'User JWT: <token>' found in {LOG_FILE}. Content: {content!r}"
    )
    return matches[-1]


@pytest.fixture(scope="module")
def token():
    return _read_token_from_log()


@pytest.fixture(scope="module")
def expected():
    return _expected_identifiers()


def test_log_file_contains_jwt(token):
    parts = token.split(".")
    assert len(parts) == 3, (
        f"Token in log does not look like a JWT (expected 3 dot-separated segments): {token!r}"
    )


def test_jwt_header_uses_hs256(token):
    header_segment = token.split(".")[0]
    padded = header_segment + "=" * (-len(header_segment) % 4)
    try:
        header_json = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
        header = json.loads(header_json)
    except Exception as exc:  # pragma: no cover - defensive
        pytest.fail(f"Failed to decode JWT header: {exc}")
    assert header.get("alg") == "HS256", (
        f"Expected JWT alg to be HS256, got: {header!r}"
    )


def test_jwt_verifies_with_secret_key_and_has_expected_payload(token, expected):
    _, expected_email, expected_external_id = expected
    secret = os.environ.get("MAGICBELL_SECRET_KEY")
    assert secret, "MAGICBELL_SECRET_KEY is not set in the verifier environment."
    api_key = os.environ.get("MAGICBELL_API_KEY")
    assert api_key, "MAGICBELL_API_KEY is not set in the verifier environment."

    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.InvalidTokenError as exc:
        pytest.fail(
            f"JWT signature verification with MAGICBELL_SECRET_KEY (HS256) failed: {exc}"
        )

    assert payload.get("user_email") == expected_email, (
        f"Expected user_email={expected_email!r}, got {payload.get('user_email')!r}"
    )
    assert payload.get("user_external_id") == expected_external_id, (
        f"Expected user_external_id={expected_external_id!r}, "
        f"got {payload.get('user_external_id')!r}"
    )
    assert payload.get("api_key") == api_key, (
        f"Expected api_key field to equal MAGICBELL_API_KEY, "
        f"got {payload.get('api_key')!r}"
    )
    exp = payload.get("exp")
    assert isinstance(exp, (int, float)), (
        f"Expected numeric 'exp' claim in JWT payload, got {exp!r}"
    )
    assert exp > time.time(), (
        f"JWT 'exp' claim {exp} is not in the future (now={time.time()})."
    )


def test_jwt_authorizes_user_client_rest_endpoint(token):
    """The minted JWT must be accepted by MagicBell's user-client REST API."""
    url = f"{MAGICBELL_API_BASE}/notifications"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"Expected HTTP 200 from GET {url} with the minted User JWT, "
        f"got {response.status_code}. Body: {response.text[:500]}"
    )
    try:
        body = response.json()
    except ValueError:
        pytest.fail(f"Response from {url} was not valid JSON: {response.text[:500]}")
    assert isinstance(body, dict), (
        f"Expected JSON object from {url}, got: {type(body).__name__}"
    )
    # MagicBell v2 user-client list endpoints return a `notifications` array.
    assert "notifications" in body, (
        f"Expected 'notifications' key in response JSON, got keys: {list(body.keys())}"
    )
    assert isinstance(body["notifications"], list), (
        f"Expected 'notifications' to be a list, got {type(body['notifications']).__name__}"
    )
