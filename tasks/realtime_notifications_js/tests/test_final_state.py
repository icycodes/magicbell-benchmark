import os
import time
import json
import pytest
import requests
import socket
from xprocess import ProcessStarter
from email.header import decode_header, make_header
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_DIR = "/home/user/realtime-task"
OUTPUT_FILE = os.path.join(PROJECT_DIR, "output.json")
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

def list_inbox(max_results=20):
    token_info = json.loads(os.environ["GMAIL_TOKEN_JSON"])
    creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    service = build("gmail", "v1", credentials=creds)
    response = service.users().messages().list(
        userId="me",
        q="label:inbox",
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
    """
    Starts the Node.js application index.js using xprocess.
    """
    class Starter(ProcessStarter):
        name = "start_app"
        args = ["node", "index.js"]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 180
        terminate_on_interrupt = True

        def startup_check(self):
            # Since it is a WebSocket daemon and does not listen on a local port,
            # we wait for a short duration to ensure startup is complete.
            time.sleep(3)
            return True

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()

def test_realtime_and_email_notification(start_app):
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id is not None, "ZEALT_RUN_ID environment variable is not set."

    # Trigger a broadcast notification using the MagicBell Project API
    url = "https://api.magicbell.com/broadcasts"
    headers = {
        "Authorization": f"Bearer {os.environ['MAGICBELL_PROJECT_TOKEN']}",
        "X-MAGICBELL-API-KEY": os.environ["MAGICBELL_API_KEY"],
        "Content-Type": "application/json"
    }
    expected_title = f"Alert for {run_id}"
    expected_content = f"This is a real-time event test for {run_id}"
    recipient_email = f"receiver-{run_id}@gmail.com"

    payload = {
        "title": expected_title,
        "content": expected_content,
        "recipients": [{"email": recipient_email}]
    }

    response = requests.post(url, headers=headers, json=payload)
    assert response.status_code == 201 or response.status_code == 200, \
        f"Failed to trigger MagicBell broadcast: {response.status_code} - {response.text}"

    # Wait for the real-time notification to be received and written to output.json
    time.sleep(10)

    # 1. Verify that output.json exists and contains the correct real-time event data
    assert os.path.isfile(OUTPUT_FILE), f"Output file not found at {OUTPUT_FILE}"
    with open(OUTPUT_FILE, "r") as f:
        data = json.load(f)

    assert data.get("title") == expected_title, \
        f"Expected title to be '{expected_title}', but got '{data.get('title')}'"
    assert data.get("content") == expected_content, \
        f"Expected content to be '{expected_content}', but got '{data.get('content')}'"

    # 2. Verify that the email was successfully sent and received in Gmail inbox
    gmail_user = os.environ.get("GMAIL_USER_NAME")
    assert gmail_user is not None, "GMAIL_USER_NAME environment variable is not set."
    full_recipient_email = f"{gmail_user}+{recipient_email}"

    # Fetch inbox and search for the email
    inbox = list_inbox(max_results=20)
    found_email = False
    for msg in inbox:
        to_header = msg.get("to", "")
        subject_header = msg.get("subject", "")
        # Check if recipient matches and subject contains our run-id alert
        if full_recipient_email in to_header and expected_title in subject_header:
            found_email = True
            break

    assert found_email, f"Could not find the expected email notification sent to {full_recipient_email} with subject containing '{expected_title}'"
