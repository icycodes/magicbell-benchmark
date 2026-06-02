import os
import re

import requests


OUTPUT_LOG = "/home/user/magicbell-task/output.log"
BROADCAST_ID_PATTERN = re.compile(r"Broadcast ID:\s*([A-Za-z0-9_\-]+)")


def _get_run_id():
    run_id = os.environ.get("ZEALT_RUN_ID", "").strip()
    assert run_id, "ZEALT_RUN_ID environment variable is missing or empty."
    return run_id


def _get_project_token():
    token = os.environ.get("MAGICBELL_PROJECT_TOKEN", "").strip()
    assert token, "MAGICBELL_PROJECT_TOKEN environment variable is missing or empty."
    return token


def _get_api_key():
    key = os.environ.get("MAGICBELL_API_KEY", "").strip()
    assert key, "MAGICBELL_API_KEY environment variable is missing or empty."
    return key


def _read_broadcast_id():
    assert os.path.isfile(OUTPUT_LOG), f"Output log file not found at {OUTPUT_LOG}"
    with open(OUTPUT_LOG, "r") as f:
        content = f.read()
    match = BROADCAST_ID_PATTERN.search(content)
    assert match, (
        f"Output log {OUTPUT_LOG} does not contain a line matching "
        f"'Broadcast ID: <broadcast_id>'. Content was: {content!r}"
    )
    broadcast_id = match.group(1).strip()
    assert broadcast_id, "Captured Broadcast ID from output.log is empty."
    return broadcast_id


def _unwrap(payload, key):
    """Best-effort: look for `key` at top-level, under `data`, or under `broadcast`."""
    if not isinstance(payload, dict):
        return None
    if key in payload:
        return payload[key]
    for wrapper in ("data", "broadcast"):
        inner = payload.get(wrapper)
        if isinstance(inner, dict) and key in inner:
            return inner[key]
    return None


def _expected_topic():
    return f"topic-cli-{_get_run_id()}"


def _expected_title():
    return f"Topic Subs CLI - {_get_run_id()}"


def _expected_user_external_ids():
    run_id = _get_run_id()
    return [
        f"user-topic-subs-cli-1-{run_id}",
        f"user-topic-subs-cli-2-{run_id}",
    ]


def test_output_log_contains_broadcast_id():
    """Verify the log file exists and contains a valid Broadcast ID line."""
    broadcast_id = _read_broadcast_id()
    assert broadcast_id, "Broadcast ID parsed from output.log is empty."


def test_broadcast_title_and_topic():
    """Fetch the broadcast via v2 REST API and assert title + topic match."""
    project_token = _get_project_token()
    broadcast_id = _read_broadcast_id()

    url = f"https://api.magicbell.com/v2/broadcasts/{broadcast_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"MagicBell fetch broadcast returned status "
        f"{response.status_code}: {response.text}"
    )

    body = response.json()
    title = _unwrap(body, "title")
    topic = _unwrap(body, "topic")

    assert title == _expected_title(), (
        f"Broadcast title mismatch. Expected '{_expected_title()}', got "
        f"'{title}'. Full body: {body!r}"
    )
    assert topic == _expected_topic(), (
        f"Broadcast topic mismatch. Expected '{_expected_topic()}', got "
        f"'{topic}'. Full body: {body!r}"
    )


def test_broadcast_recipients_use_topic_subscribers_form():
    """Friction point: recipients MUST use the nested {topic:{subscribers:true}} form."""
    project_token = _get_project_token()
    broadcast_id = _read_broadcast_id()

    url = f"https://api.magicbell.com/v2/broadcasts/{broadcast_id}"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=30)
    assert response.status_code == 200, (
        f"MagicBell fetch broadcast returned status "
        f"{response.status_code}: {response.text}"
    )

    body = response.json()
    recipients = _unwrap(body, "recipients")
    assert isinstance(recipients, list) and recipients, (
        f"Expected non-empty recipients array. Full body: {body!r}"
    )

    found_nested = False
    for entry in recipients:
        if not isinstance(entry, dict):
            continue
        topic_val = entry.get("topic")
        if isinstance(topic_val, dict) and topic_val.get("subscribers") is True:
            found_nested = True
            break
    assert found_nested, (
        "Broadcast recipients does not include the friction-point nested form "
        "{topic: {subscribers: true}}. Recipients seen: "
        f"{recipients!r}"
    )


def test_users_subscribed_to_topic():
    """Each user must have a topic subscription record for topic-cli-${run-id}."""
    api_key = _get_api_key()
    expected_topic = _expected_topic()

    for external_id in _expected_user_external_ids():
        headers = {
            "X-MAGICBELL-API-KEY": api_key,
            "X-MAGICBELL-USER-EXTERNAL-ID": external_id,
            "Accept": "application/json",
        }
        response = requests.get(
            "https://api.magicbell.com/subscriptions",
            headers=headers,
            timeout=30,
        )
        assert response.status_code == 200, (
            f"MagicBell list subscriptions for {external_id} returned status "
            f"{response.status_code}: {response.text}"
        )
        body = response.json()
        subs = body.get("subscriptions")
        assert isinstance(subs, list), (
            f"Expected 'subscriptions' array in response for {external_id}, got: {body!r}"
        )
        topics = [s.get("topic") for s in subs if isinstance(s, dict)]
        assert expected_topic in topics, (
            f"User {external_id} is not subscribed to '{expected_topic}'. "
            f"Subscribed topics: {topics!r}"
        )
