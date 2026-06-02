import os
import re
import time

import jwt
import requests

OUTPUT_LOG = "/home/user/myproject/output.log"
MAGICBELL_API_BASE = "https://api.magicbell.com"


def _run_id() -> str:
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set in the verifier environment."
    return run_id


def _credentials() -> dict:
    creds = {
        "api_key": os.environ.get("MAGICBELL_API_KEY"),
        "secret_key": os.environ.get("MAGICBELL_SECRET_KEY"),
        "email": os.environ.get("MAGICBELL_EMAIL"),
    }
    for name, value in creds.items():
        assert value, f"Required env var for MagicBell credential '{name}' is not set."
    return creds


def _expected_user_email(magicbell_email: str, run_id: str) -> str:
    assert "@" in magicbell_email, f"MAGICBELL_EMAIL is not a valid email: {magicbell_email}"
    local, domain = magicbell_email.split("@", 1)
    return f"{local}+archive-js-{run_id}@{domain}"


def _read_archived_notification_id() -> str:
    assert os.path.isfile(OUTPUT_LOG), f"Output log not found at {OUTPUT_LOG}."
    with open(OUTPUT_LOG, "r", encoding="utf-8") as fh:
        content = fh.read()
    match = re.search(r"Archived Notification ID:\s*(\S+)", content)
    assert match, (
        f"Could not find a line matching 'Archived Notification ID: <id>' in {OUTPUT_LOG}.\n"
        f"Log content:\n{content}"
    )
    notif_id = match.group(1).strip()
    assert notif_id, "Archived Notification ID value is empty in the log."
    return notif_id


def _sign_user_jwt(user_email: str, user_external_id: str, api_key: str, secret_key: str) -> str:
    payload = {
        "user_email": user_email,
        "user_external_id": user_external_id,
        "api_key": api_key,
    }
    return jwt.encode(payload, secret_key, algorithm="HS256")


def _fetch_notification(notification_id: str, user_jwt: str, api_key: str) -> dict:
    url = f"{MAGICBELL_API_BASE}/notifications/{notification_id}"
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "X-MAGICBELL-API-KEY": api_key,
        "Accept": "application/json",
    }
    # Allow a brief retry window for eventual-consistency on the archive write.
    last_response = None
    for _ in range(5):
        last_response = requests.get(url, headers=headers, timeout=30)
        if last_response.status_code == 200:
            return last_response.json()
        time.sleep(2)
    assert False, (
        f"GET {url} returned non-200 status: "
        f"{last_response.status_code if last_response is not None else 'no response'} "
        f"{last_response.text if last_response is not None else ''}"
    )


def test_output_log_contains_archived_notification_id():
    notification_id = _read_archived_notification_id()
    assert re.match(r"^[A-Za-z0-9_\-]+$", notification_id), (
        f"Archived notification id has unexpected format: {notification_id!r}."
    )


def test_notification_is_archived_via_magicbell_api():
    run_id = _run_id()
    creds = _credentials()
    notification_id = _read_archived_notification_id()
    user_external_id = f"user-archive-js-{run_id}"
    user_email = _expected_user_email(creds["email"], run_id)

    user_jwt = _sign_user_jwt(user_email, user_external_id, creds["api_key"], creds["secret_key"])
    body = _fetch_notification(notification_id, user_jwt, creds["api_key"])

    expected_title = f"Archive JS - {run_id}"
    actual_title = body.get("title")
    assert actual_title == expected_title, (
        f"Expected notification title {expected_title!r}, got {actual_title!r}. "
        f"Response keys: {list(body.keys())}"
    )

    archived_at = body.get("archived_at")
    assert archived_at, (
        f"Notification {notification_id} is not archived. "
        f"'archived_at' must be a non-null timestamp, got: {archived_at!r}."
    )
