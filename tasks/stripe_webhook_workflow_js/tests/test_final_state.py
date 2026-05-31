import os
import json
import socket
import time
import subprocess
import requests
import pytest
from xprocess import ProcessStarter
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from email.header import decode_header, make_header

PROJECT_DIR = "/home/user/stripe-webhook-app"
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def decode_mime_header(value):
    if not value:
        return ""
    return str(make_header(decode_header(value)))


def get_header(headers, name):
    for header in headers:
        if header.get("name", "").lower() == name.lower():
            return decode_mime_header(header.get("value", ""))
    return ""


def list_inbox_for_recipient(recipient_email, max_results=10):
    if "GMAIL_TOKEN_JSON" not in os.environ:
        return []
    
    token_info = json.loads(os.environ["GMAIL_TOKEN_JSON"])
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)

    service = build("gmail", "v1", credentials=creds)

    # Search for emails sent to the specific recipient email
    response = service.users().messages().list(
        userId="me",
        q=f"to:{recipient_email}",
        maxResults=max_results,
    ).execute()

    messages = response.get("messages", [])

    if not messages:
        return []

    inbox_messages = []

    for msg in messages:
        detail = service.users().messages().get(
            userId="me",
            id=msg["id"],
            format="metadata",
            metadataHeaders=["From", "To", "Subject", "Date"],
        ).execute()

        headers = detail.get("payload", {}).get("headers", [])

        inbox_messages.append(
            {
                "from": get_header(headers, "From"),
                "to": get_header(headers, "To"),
                "subject": get_header(headers, "Subject"),
                "date": get_header(headers, "Date"),
            }
        )

    return inbox_messages


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Starts the Express server using xprocess and waits until it is ready."""
    class Starter(ProcessStarter):
        name = "stripe_webhook_app"
        args = ["node", "server.js"]
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


def test_stripe_webhook_flow(start_app):
    # 1. Retrieve environment variables
    run_id = os.environ.get("ZEALT_RUN_ID", "local")
    gmail_user = os.environ.get("GMAIL_USER_NAME")
    assert gmail_user is not None, "GMAIL_USER_NAME environment variable is not set."

    recipient_email = f"{gmail_user}+stripe-{run_id}@gmail.com"

    # 2. Prepare the mock Stripe webhook payload
    payload = {
        "type": "charge.succeeded",
        "data": {
            "object": {
                "id": "ch_test_123",
                "amount": 4900,
                "receipt_email": recipient_email
            }
        }
    }

    # 3. Send the POST request to the webhook endpoint
    url = "http://localhost:3000/webhook"
    try:
        response = requests.post(url, json=payload, timeout=10)
    except requests.exceptions.RequestException as e:
        pytest.fail(f"Failed to connect to the Express server at {url}: {e}")

    # 4. Verify the response
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}. Response: {response.text}"
    
    resp_data = response.json()
    assert resp_data.get("status") == "success", f"Expected response status to be 'success', got {resp_data.get('status')}"
    assert "broadcast_id" in resp_data, "Response does not contain 'broadcast_id'"
    assert isinstance(resp_data["broadcast_id"], str) and len(resp_data["broadcast_id"]) > 0, "broadcast_id is not a valid non-empty string"

    # 5. Verify the email notification via Gmail API
    email_found = False
    # Email delivery might take a few seconds, so we poll for up to 60 seconds
    for attempt in range(12):
        messages = list_inbox_for_recipient(recipient_email)
        for msg in messages:
            if "Payment Succeeded - ch_test_123" in msg["subject"]:
                email_found = True
                break
        if email_found:
            break
        time.sleep(5)

    assert email_found, f"Could not find email sent to {recipient_email} with subject 'Payment Succeeded - ch_test_123'"
