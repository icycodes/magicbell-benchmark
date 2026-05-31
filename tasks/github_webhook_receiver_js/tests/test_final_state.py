import os
import subprocess
import json
import socket
import hmac
import hashlib
import requests
import pytest
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"

@pytest.fixture(scope="session")
def start_app(xprocess):
    """
    Starts the Express.js service using xprocess. Confirms readiness via port check.
    """
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


def test_missing_signature(start_app):
    """
    Verify that requests without an x-hub-signature-256 header are rejected with 401.
    """
    payload = {
        "action": "opened",
        "issue": {
            "title": "Test Issue",
            "html_url": "https://github.com/example/repo/issues/1"
        }
    }
    headers = {
        "Content-Type": "application/json"
    }
    res = requests.post("http://localhost:3000/webhooks/github", json=payload, headers=headers)
    assert res.status_code == 401, f"Expected 401 Unauthorized for missing signature, got {res.status_code}"


def test_invalid_signature(start_app):
    """
    Verify that requests with an invalid x-hub-signature-256 header are rejected with 401.
    """
    payload = {
        "action": "opened",
        "issue": {
            "title": "Test Issue",
            "html_url": "https://github.com/example/repo/issues/1"
        }
    }
    headers = {
        "Content-Type": "application/json",
        "x-hub-signature-256": "sha256=invalid_hash_value"
    }
    res = requests.post("http://localhost:3000/webhooks/github", json=payload, headers=headers)
    assert res.status_code == 401, f"Expected 401 Unauthorized for invalid signature, got {res.status_code}"


def test_valid_signature_and_broadcast(start_app):
    """
    Verify that a valid issues.opened webhook is processed, returns success, and triggers a MagicBell broadcast.
    """
    run_id = os.environ.get("ZEALT_RUN_ID", "test_run_id")
    webhook_secret = os.environ.get("GITHUB_WEBHOOK_SECRET", "test_secret")
    magicbell_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    
    assert magicbell_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set."

    payload = {
        "action": "opened",
        "issue": {
            "title": f"Test Issue {run_id}",
            "html_url": "https://github.com/example/repo/issues/1"
        }
    }
    
    # Generate valid signature
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    mac = hmac.new(webhook_secret.encode('utf-8'), payload_bytes, hashlib.sha256)
    signature = f"sha256={mac.hexdigest()}"

    headers = {
        "Content-Type": "application/json",
        "x-hub-signature-256": signature
    }

    # Send valid webhook event
    res = requests.post("http://localhost:3000/webhooks/github", data=payload_bytes, headers=headers)
    assert res.status_code in [200, 201], f"Expected 200 or 201 for valid webhook, got {res.status_code}. Response: {res.text}"

    # Verify that the broadcast is recorded in MagicBell
    # We query the GET /broadcasts endpoint using the MAGICBELL_PROJECT_TOKEN
    magicbell_headers = {
        "Authorization": f"Bearer {magicbell_token}",
        "Accept": "application/json"
    }
    
    # Try querying with v2 base URL as well as standard v2 path
    magicbell_res = requests.get("https://api.magicbell.com/v2/broadcasts", headers=magicbell_headers)
    if magicbell_res.status_code != 200:
        magicbell_res = requests.get("https://api.magicbell.com/broadcasts", headers=magicbell_headers)
        
    assert magicbell_res.status_code == 200, f"Failed to retrieve broadcasts from MagicBell API: {magicbell_res.text}"
    
    res_json = magicbell_res.json()
    broadcasts = []
    if "broadcasts" in res_json:
        broadcasts = res_json["broadcasts"]
    elif "data" in res_json:
        broadcasts = res_json["data"]
    elif isinstance(res_json, list):
        broadcasts = res_json
        
    expected_title = f"New GitHub Issue: Test Issue {run_id} (Run ID: {run_id})"
    
    found = False
    for b in broadcasts:
        title = b.get("title")
        if not title and "broadcast" in b:
            title = b["broadcast"].get("title")
        if title and expected_title in title:
            found = True
            break
            
    assert found, f"Expected broadcast with title '{expected_title}' was not found in MagicBell broadcasts. Found titles: {[b.get('title') for b in broadcasts]}"
