import json
import os
import re

import pytest
import requests

LOG_PATH = "/home/user/myproject/output.log"


def _read_log_lines():
    assert os.path.isfile(LOG_PATH), f"Log file not found at {LOG_PATH}"
    with open(LOG_PATH, "r") as f:
        raw = f.read()
    lines = [ln for ln in raw.splitlines() if ln.strip() != ""]
    assert len(lines) >= 2, (
        f"Expected at least 2 non-empty lines (Event ID + JSON dump) in {LOG_PATH}; "
        f"got {len(lines)}: {raw!r}"
    )
    return lines


def test_log_first_line_is_event_id():
    lines = _read_log_lines()
    match = re.match(r"^Event ID:\s*(\S+)\s*$", lines[0])
    assert match, (
        f"First line of {LOG_PATH} must match 'Event ID: <event_id>'; "
        f"got: {lines[0]!r}"
    )
    event_id = match.group(1)
    assert event_id and event_id != "", \
        f"Event ID in {LOG_PATH} is empty: {lines[0]!r}"


def test_log_second_line_is_json_object():
    lines = _read_log_lines()
    try:
        parsed = json.loads(lines[1])
    except json.JSONDecodeError as exc:
        pytest.fail(
            f"Second line of {LOG_PATH} must be a single-line JSON object; "
            f"failed to parse: {exc}; line: {lines[1]!r}"
        )
    assert isinstance(parsed, dict), (
        f"Second line of {LOG_PATH} must decode to a JSON object (dict); "
        f"got: {type(parsed).__name__}"
    )


def test_logged_event_json_contains_run_id_title():
    run_id = os.environ.get("ZEALT_RUN_ID", "").strip()
    assert run_id, "ZEALT_RUN_ID environment variable is missing or empty."

    lines = _read_log_lines()
    expected_title = f"Events Demo - {run_id}"
    assert expected_title in lines[1], (
        f"Expected the logged event JSON (line 2) to contain the broadcast title "
        f"'{expected_title}'; got: {lines[1]!r}"
    )


def test_event_visible_in_magicbell_events_api():
    run_id = os.environ.get("ZEALT_RUN_ID", "").strip()
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN", "").strip()
    assert run_id, "ZEALT_RUN_ID environment variable is missing or empty."
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is missing or empty."

    url = "https://api.magicbell.com/v2/events"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json",
    }

    response = requests.get(url, headers=headers, params={"limit": 50}, timeout=30)
    assert response.status_code == 200, (
        f"Failed to list MagicBell events. "
        f"Status: {response.status_code}, Response: {response.text}"
    )

    payload = response.json()
    events = payload.get("data") or payload.get("events") or []
    assert isinstance(events, list) and len(events) > 0, (
        f"Expected a non-empty list of events from /v2/events; got: {payload!r}"
    )

    expected_title = f"Events Demo - {run_id}"
    matched = [e for e in events if expected_title in json.dumps(e)]
    assert matched, (
        f"Expected at least one event referencing the broadcast title "
        f"'{expected_title}' in the latest 50 project events; "
        f"none found among {len(events)} events."
    )
