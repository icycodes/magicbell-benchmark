import json
import os
import re
import time

import pytest
import requests

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")
MAGICBELL_EVENTS_URL = "https://api.magicbell.com/v2/events"


@pytest.fixture(scope="session")
def run_id():
    rid = os.environ.get("ZEALT_RUN_ID")
    assert rid, "ZEALT_RUN_ID environment variable is not set."
    return rid


@pytest.fixture(scope="session")
def magicbell_project_token():
    token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    return token


@pytest.fixture(scope="session")
def expected_broadcast_title(run_id):
    return f"Events Demo Go - {run_id}"


@pytest.fixture(scope="session")
def logged_event_id():
    assert os.path.isfile(LOG_FILE), f"Output log file not found at {LOG_FILE}"
    with open(LOG_FILE, "r") as f:
        content = f.read()
    match = re.search(r"Event ID:\s*([A-Za-z0-9_\-]+)", content)
    assert match, (
        "Could not find a line matching 'Event ID: <event_id>' in "
        f"{LOG_FILE}. File contents:\n{content}"
    )
    event_id = match.group(1).strip()
    assert event_id, f"Extracted event_id is empty from {LOG_FILE}"
    return event_id


@pytest.fixture(scope="session")
def events_payload(magicbell_project_token):
    headers = {
        "Authorization": f"Bearer {magicbell_project_token}",
        "Accept": "application/json",
    }
    # Poll for up to 30s in case the event log lags slightly behind the broadcast call.
    last_response_text = ""
    deadline = time.time() + 30
    while True:
        response = requests.get(
            MAGICBELL_EVENTS_URL,
            headers=headers,
            params={"limit": 50},
            timeout=15,
        )
        last_response_text = response.text
        if response.status_code == 200:
            data = response.json()
            events = data.get("data") or []
            if events:
                return events
        if time.time() >= deadline:
            break
        time.sleep(3)
    pytest.fail(
        "Failed to retrieve events from MagicBell API. "
        f"Last response: {last_response_text}"
    )


def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file does not exist at {LOG_FILE}"


def test_log_file_contains_event_id(logged_event_id):
    assert logged_event_id, "Event ID extracted from log file should not be empty"


def test_events_api_contains_broadcast_event(events_payload, expected_broadcast_title):
    serialized = json.dumps(events_payload)
    assert expected_broadcast_title in serialized, (
        "Expected to find an event whose payload references the broadcast title "
        f"'{expected_broadcast_title}' in the recent MagicBell events list, but "
        f"none was found. Events: {serialized[:2000]}"
    )


def test_logged_event_id_matches_api(events_payload, logged_event_id):
    api_event_ids = []
    for event in events_payload:
        eid = event.get("id")
        if eid:
            api_event_ids.append(str(eid))
    assert logged_event_id in api_event_ids, (
        f"Logged Event ID '{logged_event_id}' was not found among the most "
        f"recent MagicBell events (limit 50). API event IDs: {api_event_ids}"
    )
