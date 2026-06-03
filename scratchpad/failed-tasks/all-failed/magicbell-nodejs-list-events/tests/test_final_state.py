import os
import subprocess
import json
import requests
import pytest

PROJECT_DIR = "/home/user/magicbell-task"
EVENTS_FILE = os.path.join(PROJECT_DIR, "events.json")

@pytest.fixture(scope="session", autouse=True)
def setup_environment():
    # Remove events.json if it exists
    if os.path.isfile(EVENTS_FILE):
        os.remove(EVENTS_FILE)
        
    # Run npm install
    subprocess.run(["npm", "install"], cwd=PROJECT_DIR, check=True)

def test_script_execution():
    """Run node index.js and verify it executes successfully."""
    run_id = os.environ.get("ZEALT_RUN_ID", "test-run")
    env = os.environ.copy()
    
    result = subprocess.run(
        ["node", "index.js"],
        cwd=PROJECT_DIR,
        env=env,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Script execution failed. stdout: {result.stdout}, stderr: {result.stderr}"

def test_events_file_created():
    """Check that events.json was created."""
    assert os.path.isfile(EVENTS_FILE), "events.json was not created."

def test_events_file_content():
    """Verify events.json contains an array of up to 5 events."""
    with open(EVENTS_FILE, "r") as f:
        try:
            events = json.load(f)
        except json.JSONDecodeError:
            pytest.fail("events.json is not valid JSON.")
            
    assert isinstance(events, list), "events.json does not contain a JSON array."
    assert len(events) > 0, "events array is empty."
    assert len(events) <= 5, f"events array has more than 5 items: {len(events)}"

def test_broadcast_event_exists_in_file():
    """Verify the generated broadcast event is in the events array."""
    run_id = os.environ.get("ZEALT_RUN_ID", "test-run")
    expected_title = f"Test Event {run_id}"
    
    with open(EVENTS_FILE, "r") as f:
        events = json.load(f)
        
    # Look for an event related to the broadcast we created
    # The event might be a broadcast_created action or just contain the title in its data
    found = False
    for event in events:
        event_str = json.dumps(event)
        if expected_title in event_str:
            found = True
            break
            
    assert found, f"Could not find an event containing the title '{expected_title}' in events.json."

def test_broadcast_exists_via_api():
    """Verify via MagicBell API that the broadcast was actually created."""
    run_id = os.environ.get("ZEALT_RUN_ID", "test-run")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    expected_title = f"Test Event {run_id}"
    
    assert project_token, "MAGICBELL_PROJECT_TOKEN is missing."
    
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Accept": "application/json"
    }
    
    # We can fetch events using the API to verify the broadcast event exists
    response = requests.get(
        "https://api.magicbell.com/events?limit=20",
        headers=headers
    )
    assert response.status_code == 200, f"Failed to fetch events from API: {response.text}"
    
    events = response.json().get("events", [])
    found = False
    for event in events:
        if expected_title in json.dumps(event):
            found = True
            break
            
    assert found, f"Could not find an event containing the title '{expected_title}' via the MagicBell API. The broadcast might not have been created."
