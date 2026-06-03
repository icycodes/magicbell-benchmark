import os
import subprocess
import json
import socket
import threading
import time
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
                return s.connect_ex(("localhost", 5173)) == 0

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()

def trigger_broadcast(run_id):
    # Wait 10 seconds to allow the browser verifier to load the page
    time.sleep(10)
    email = os.environ["MAGICBELL_EMAIL"]
    
    # Login to MagicBell CLI
    subprocess.run([
        "npx", "-y", "magicbell-cli", "login", "--manual",
        "--email", email,
        "--jwt", os.environ["MAGICBELL_PROJECT_TOKEN"],
        "--api-key", os.environ["MAGICBELL_API_KEY"],
        "--secret-key", os.environ["MAGICBELL_SECRET_KEY"]
    ], check=True)

    # Create Broadcast
    data = json.dumps({
        "title": f"Real-time Event {run_id}",
        "recipients": [{"email": f"{email}+{run_id}@gmail.com"}]
    })
    subprocess.run([
        "npx", "-y", "magicbell-cli", "broadcast", "create", "--data", data
    ], check=True)

def test_real_time_event(start_app, browser_verifier):
    run_id = os.environ.get("ZEALT_RUN_ID", "test-run-id")
    
    # Start background thread to send the broadcast while verifier is checking
    t = threading.Thread(target=trigger_broadcast, args=(run_id,))
    t.start()

    reason = "The application should display new notifications in real-time when they are received via the core event bus."
    truth = f"Navigate to http://localhost:5173. Keep checking the page for up to 30 seconds until a new element with data-testid='notification-item' appears in the DOM and its text content includes 'Real-time Event {run_id}'. Once it appears, the verification is successful."

    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_real_time_event"
    )
    
    t.join()
    assert result.status == "pass", f"Browser verification failed: {result.reason}"