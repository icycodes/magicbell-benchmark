import os
import re
import requests
import pytest

OUTPUT_LOG = "/home/user/myproject/output.log"
USER_ID_PATTERN = re.compile(r"User ID:\s*([A-Za-z0-9\-]+)")


def _get_run_id():
    run_id = os.environ.get("ZEALT_RUN_ID", "").strip()
    assert run_id, "ZEALT_RUN_ID environment variable is missing or empty."
    return run_id


def _get_email_parts():
    raw = os.environ.get("MAGICBELL_EMAIL", "").strip()
    assert raw, "MAGICBELL_EMAIL environment variable is missing or empty."
    assert "@" in raw, f"MAGICBELL_EMAIL '{raw}' does not contain '@'."
    local, domain = raw.split("@", 1)
    assert local and domain, f"MAGICBELL_EMAIL '{raw}' must be of the form local@domain."
    return local, domain


def _get_project_token():
    token = os.environ.get("MAGICBELL_PROJECT_TOKEN", "").strip()
    assert token, "MAGICBELL_PROJECT_TOKEN environment variable is missing or empty."
    return token


def _read_user_id():
    assert os.path.isfile(OUTPUT_LOG), f"Output log file not found at {OUTPUT_LOG}"
    with open(OUTPUT_LOG, "r") as f:
        content = f.read()
    match = USER_ID_PATTERN.search(content)
    assert match, (
        f"Output log {OUTPUT_LOG} does not contain a line matching "
        f"'User ID: <id>'. Content was: {content!r}"
    )
    user_id = match.group(1).strip()
    assert user_id, "Captured User ID from output.log is empty."
    return user_id


def test_output_log_contains_user_id():
    """Verify that output.log exists and contains a User ID line."""
    user_id = _read_user_id()
    assert user_id, "User ID parsed from output.log is empty."


def test_magicbell_user_persisted_via_rest_api():
    """Use the MagicBell v2 REST API to confirm the user was upserted with the
    expected external_id and email."""
    run_id = _get_run_id()
    local, domain = _get_email_parts()
    project_token = _get_project_token()
    user_id = _read_user_id()

    expected_external_id = f"user-{run_id}"
    expected_email = f"{local}+save-user-js-{run_id}@{domain}"

    url = "https://api.magicbell.com/v2/users"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }
    params = {"query": expected_external_id}

    response = requests.get(url, headers=headers, params=params, timeout=30)
    assert response.status_code == 200, (
        f"MagicBell list users API returned status {response.status_code}: "
        f"{response.text}"
    )

    body = response.json()
    users = body.get("data") or []
    assert isinstance(users, list), (
        f"Expected 'data' to be a list in MagicBell response, got: {body!r}"
    )

    matches = [
        u for u in users
        if (u.get("external_id") == expected_external_id)
        or (u.get("externalId") == expected_external_id)
    ]
    assert matches, (
        f"No MagicBell user with external_id '{expected_external_id}' returned "
        f"by query. Response body: {body!r}"
    )

    user = matches[0]

    actual_email = user.get("email")
    assert actual_email == expected_email, (
        f"MagicBell user email mismatch. Expected '{expected_email}', "
        f"got '{actual_email}'."
    )

    actual_id = user.get("id")
    assert actual_id == user_id, (
        f"MagicBell user id mismatch. The id in output.log was '{user_id}', "
        f"but the API returned '{actual_id}' for external_id "
        f"'{expected_external_id}'."
    )
