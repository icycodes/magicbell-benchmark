import os
import socket
import time

import jwt as pyjwt
import pytest
import requests
from pochi_verifier import PochiVerifier
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
FRONTEND_PORT = 3000
BACKEND_PORT = 3001


def _run_id():
    rid = os.environ.get("ZEALT_RUN_ID")
    assert rid, "ZEALT_RUN_ID environment variable must be set."
    return rid


def _port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex(("localhost", port)) == 0


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
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open(FRONTEND_PORT) and _port_open(BACKEND_PORT)

    xprocess.ensure(Starter.name, Starter)

    # Give the backend a moment to finish upsert + broadcast on startup.
    time.sleep(5)

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def test_backend_token_endpoint(start_app):
    run_id = _run_id()
    expected_external_id = f"user-fi-{run_id}"

    resp = requests.get(f"http://localhost:{BACKEND_PORT}/token", timeout=15)
    assert resp.status_code == 200, (
        f"GET /token expected 200, got {resp.status_code}: {resp.text}"
    )

    body = resp.json()
    assert "token" in body and isinstance(body["token"], str) and body["token"], (
        f"GET /token response must be JSON with a non-empty 'token' string, got: {body}"
    )

    payload = pyjwt.decode(body["token"], options={"verify_signature": False})
    assert payload.get("user_external_id") == expected_external_id, (
        f"JWT payload user_external_id must equal {expected_external_id}, got {payload.get('user_external_id')}"
    )
    assert payload.get("user_email"), (
        f"JWT payload must contain user_email, got payload: {payload}"
    )
    assert payload.get("api_key"), (
        f"JWT payload must contain api_key, got payload: {payload}"
    )


def test_floating_inbox(start_app):
    run_id = _run_id()
    reason = (
        "The web app should render a MagicBell floating inbox bell icon in a "
        "header and, when clicked, display a notification seeded by the "
        "backend at startup."
    )
    truth = (
        f"Navigate to http://localhost:{FRONTEND_PORT} and verify a bell icon "
        "is visible in the header on initial load. Click the bell icon. "
        "Verify the floating inbox panel opens and contains at least one "
        f"notification whose title contains 'Floating Inbox - {run_id}'."
    )

    verifier = PochiVerifier()
    result = verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_floating_inbox",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
