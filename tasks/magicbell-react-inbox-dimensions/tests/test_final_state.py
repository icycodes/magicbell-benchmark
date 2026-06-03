import pytest
import subprocess
import os
import socket
import requests
import jwt
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
            port_3000 = False
            port_3001 = False
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                if s.connect_ex(("localhost", 3000)) == 0:
                    port_3000 = True
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                if s.connect_ex(("localhost", 3001)) == 0:
                    port_3001 = True
            return port_3000 and port_3001

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()

def test_token_endpoint(start_app):
    response = requests.get("http://localhost:3001/token")
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    assert "token" in data, "Expected 'token' in response JSON"

def test_token_payload(start_app):
    response = requests.get("http://localhost:3001/token")
    token = response.json()["token"]
    
    payload = jwt.decode(token, options={"verify_signature": False})
    
    zealt_run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "test@example.com")
    api_key = os.environ.get("MAGICBELL_API_KEY", "")
    
    if "@" in magicbell_email:
        local, domain = magicbell_email.split("@", 1)
        expected_email = f"{local}+react-inbox-{zealt_run_id}@{domain}"
    else:
        expected_email = f"user+react-inbox-{zealt_run_id}@example.com"
        
    expected_external_id = f"react-inbox-{zealt_run_id}"
    
    assert payload.get("user_email") == expected_email, f"Expected user_email {expected_email}, got {payload.get('user_email')}"
    assert payload.get("user_external_id") == expected_external_id, f"Expected user_external_id {expected_external_id}, got {payload.get('user_external_id')}"
    assert payload.get("api_key") == api_key, f"Expected api_key {api_key}, got {payload.get('api_key')}"

def test_browser_inbox_dimensions(start_app, browser_verifier):
    reason = "The web app must render the MagicBell FloatingInbox with specific dimensions (width=400, height=500) and display at least one notification."
    truth = "Navigate to http://localhost:3000. Wait for the MagicBell inbox icon to appear and click it to open the inbox. Inspect the rendered inbox panel (e.g. the iframe or wrapper element) to verify its dimensions are exactly 400px wide and 500px high. Verify that at least one notification is displayed in the inbox list."
    
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_browser_inbox_dimensions"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
