import os
import socket
import requests
import pytest
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
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(("localhost", 3000)) == 0

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()

def test_trigger_broadcast(start_app):
    """
    Trigger the broadcast to ensure the user has an unread notification.
    """
    response = requests.post("http://localhost:3000/api/broadcast")
    assert response.status_code == 200, f"Expected status 200 from POST /api/broadcast, got {response.status_code}. Response: {response.text}"

def test_magicbell_custom_tabs_and_badge(start_app, browser_verifier):
    """
    Verify the frontend renders the MagicBell inbox with custom tabs and the unread badge.
    """
    reason = "The application must display a MagicBell FloatingInbox with custom tabs, and the unread badge count must be functional."
    truth = (
        "Navigate to http://localhost:3000/. "
        "Verify that the MagicBell FloatingInbox bell icon is rendered on the page. "
        "Verify that the unread badge count is visible on or near the bell icon. "
        "Click the bell icon to open the inbox. "
        "Verify that the custom tabs (e.g., 'All', 'Unread') are rendered in the inbox header."
    )

    verifier = PochiVerifier()
    result = verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_magicbell_custom_tabs_and_badge"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
