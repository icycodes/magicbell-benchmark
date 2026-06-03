import pytest
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
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s1:
                port_3000_ok = (s1.connect_ex(("localhost", 3000)) == 0)
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s2:
                port_3001_ok = (s2.connect_ex(("localhost", 3001)) == 0)
            return port_3000_ok and port_3001_ok

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()

def test_backend_jwt_endpoint(start_app):
    run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "")
    magicbell_api_key = os.environ.get("MAGICBELL_API_KEY", "")
    magicbell_secret_key = os.environ.get("MAGICBELL_SECRET_KEY", "")
    
    response = requests.get("http://localhost:3001/token")
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    
    data = response.json()
    assert "token" in data, "Response JSON does not contain 'token'"
    
    token = data["token"]
    
    # Decode the JWT
    try:
        decoded = jwt.decode(token, magicbell_secret_key, algorithms=["HS256"])
    except Exception as e:
        pytest.fail(f"Failed to decode JWT: {e}")
        
    expected_email = f"{magicbell_email}+{run_id}@gmail.com"
    expected_external_id = f"user-{run_id}"
    
    assert decoded.get("user_email") == expected_email, f"Expected user_email {expected_email}, got {decoded.get('user_email')}"
    assert decoded.get("user_external_id") == expected_external_id, f"Expected user_external_id {expected_external_id}, got {decoded.get('user_external_id')}"
    assert decoded.get("api_key") == magicbell_api_key, "API key in JWT does not match MAGICBELL_API_KEY"

def test_frontend_render_and_dimensions(start_app, browser_verifier):
    run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    
    reason = "The React app must render the MagicBell FloatingInbox with custom dimensions and display the seed broadcast."
    truth = (
        f"Navigate to http://localhost:3000. "
        f"Verify that the page loads without errors. "
        f"Click the MagicBell bell icon (or ensure the floating inbox is accessible) to open the FloatingInbox. "
        f"Verify that the inbox renders and contains the notification 'Welcome to MagicBell {run_id}'. "
        f"Verify that the FloatingInbox DOM element (or its immediate container/iframe) reflects the custom dimensions (height: 600, width: 500)."
    )
    
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_frontend_render"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
