import os
import socket
import subprocess
import requests
import jwt
import pytest
from xprocess import ProcessStarter
from pochi_verifier import PochiVerifier

PROJECT_DIR = "/home/user/myproject"

@pytest.fixture(scope="session")
def browser_verifier():
    yield PochiVerifier()

@pytest.fixture(scope="session")
def start_app(xprocess):
    """
    Starts the React dev service using xprocess. Confirms readiness via port check.
    """
    class Starter(ProcessStarter):
        name = "start_app"
        args = ["npm", "run", "dev"]
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


def test_filtered_tabs_menu_propagation(start_app, browser_verifier):
    run_id = os.environ.get("ZEALT_RUN_ID", "testrun")
    
    # 1. Generate User JWT for user_<run_id>
    user_external_id = f"user_{run_id}"
    api_key = os.environ["MAGICBELL_API_KEY"]
    secret_key = os.environ["MAGICBELL_SECRET_KEY"]
    
    user_jwt = jwt.encode(
        {
            "user_external_id": user_external_id,
            "api_key": api_key
        },
        secret_key,
        algorithm="HS256"
    )
    
    # 2. Send MagicBell broadcast to user_<run_id>
    headers = {
        "Authorization": f"Bearer {os.environ['MAGICBELL_PROJECT_TOKEN']}",
        "Content-Type": "application/json"
    }
    payload = {
        "recipients": [
            {
                "external_id": user_external_id
            }
        ],
        "title": f"Test Notification {run_id}",
        "content": "This is a test notification for filtered tabs event bubble-up check"
    }
    
    response = requests.post("https://api.magicbell.com/broadcasts", headers=headers, json=payload)
    assert response.status_code in [200, 201], f"Failed to trigger broadcast: {response.text}"
    
    # 3. Use PochiVerifier to verify UI behavior in the browser
    reason = "The React application must render custom unread notification tab where clicking the three-dots button does not trigger parent click handler, but clicking elsewhere on the notification item does."
    
    truth_instruction = (
        f"Navigate to http://localhost:3000/?token={user_jwt}. "
        f"Wait for the notification with title containing '{run_id}' to appear in the unread tab. "
        "Click the button with class 'three-dots-menu-btn' on the notification. "
        f"Verify that the notification with title containing '{run_id}' is still visible in the unread tab. "
        "Click the notification body (outside the button). "
        f"Verify that the notification with title containing '{run_id}' is no longer visible in the unread tab."
    )
    
    verifier = PochiVerifier()
    result = verifier.verify(
        reason=reason,
        truth=truth_instruction,
        use_browser_agent=True,
        trajectory_dir=f"/logs/verifier/pochi/test_filtered_tabs_menu_propagation_{run_id}"
    )
    
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
