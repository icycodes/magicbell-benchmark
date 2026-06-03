import pytest
import subprocess
import os
import socket
import requests
import time
from xprocess import ProcessStarter
from pochi_verifier import PochiVerifier

PROJECT_DIR = "/home/user/myproject"

@pytest.fixture(scope="session")
def browser_verifier():
    yield PochiVerifier()

@pytest.fixture(scope="session")
def start_app(xprocess):
    class Starter(ProcessStarter):
        name = "start_app"
        args = ["npm", "start"]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 180
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s1:
                port_3000_ready = (s1.connect_ex(("localhost", 3000)) == 0)
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s2:
                port_3001_ready = (s2.connect_ex(("localhost", 3001)) == 0)
            return port_3000_ready and port_3001_ready

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()

def test_backend_token_endpoint(start_app):
    """Test that the backend serves the User JWT."""
    response = requests.get("http://localhost:3001/token")
    assert response.status_code == 200, f"Expected 200 OK from /token, got {response.status_code}"
    data = response.json()
    assert "token" in data or isinstance(data, str), "Expected JWT token in response"

def test_browser_custom_notification_item(start_app, browser_verifier):
    """Use browser to verify the custom notification item and mark-as-read functionality."""
    run_id = os.environ.get("ZEALT_RUN_ID", "default")
    
    reason = "The application should render a FloatingInbox with a custom notification item component that includes a specific structure and a mark-as-read button."
    truth = f"""
    1. Navigate to http://localhost:3000.
    2. Wait for the page to load and click the MagicBell FloatingInbox bell icon to open the inbox.
    3. Verify that the inbox displays a notification with the title 'Test Notification {run_id}'.
    4. Inspect the DOM of this notification item. Verify there is an element with class 'custom-notification-item'.
    5. Inside the item, verify there is an element with class 'custom-notification-title' containing 'Test Notification {run_id}'.
    6. Inside the item, verify there is an element with class 'custom-notification-content' containing 'This is a test'.
    7. Inside the item, verify there is a button with class 'custom-mark-read-btn'.
    8. Click the 'custom-mark-read-btn' button.
    9. Verify that the notification is marked as read (e.g., the 'custom-mark-read-btn' should disappear or the UI should indicate it is read).
    """
    
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_browser_custom_notification_item"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"

def test_api_notification_marked_read(start_app):
    """Verify via MagicBell API that the notification was actually marked as read."""
    run_id = os.environ.get("ZEALT_RUN_ID", "default")
    
    # Get the User JWT from the backend
    response = requests.get("http://localhost:3001/token")
    assert response.status_code == 200
    token = response.json().get("token") if isinstance(response.json(), dict) else response.text
    
    # Fetch notifications using the User JWT
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    # Allow some time for the read status to propagate if needed
    time.sleep(2)
    
    api_response = requests.get("https://api.magicbell.com/notifications", headers=headers)
    assert api_response.status_code == 200, f"Failed to fetch notifications: {api_response.text}"
    
    notifications = api_response.json().get("notifications", [])
    
    target_notification = next((n for n in notifications if n.get("title") == f"Test Notification {run_id}"), None)
    assert target_notification is not None, f"Seed notification 'Test Notification {run_id}' not found in API response."
    
    is_read = target_notification.get("is_read") or target_notification.get("read_at") is not None
    assert is_read, f"Notification was not marked as read in the backend. Notification state: {target_notification}"
