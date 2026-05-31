#!/usr/bin/env python3
"""Check Gmail inbox for the broadcast notification email."""

import json
import os
import sys
import time
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Read environment variables
ZEALT_RUN_ID = os.environ.get("ZEALT_RUN_ID", "")
GMAIL_USER_NAME = os.environ.get("GMAIL_USER_NAME", "")
GMAIL_TOKEN_JSON = os.environ.get("GMAIL_TOKEN_JSON", "")

# Parse the Gmail token JSON
token_data = json.loads(GMAIL_TOKEN_JSON)

# Create credentials from the token
creds = Credentials(
    token=token_data.get("token"),
    refresh_token=token_data.get("refresh_token"),
    token_uri=token_data.get("token_uri"),
    client_id=token_data.get("client_id"),
    client_secret=token_data.get("client_secret"),
    scopes=token_data.get("scopes", ["https://www.googleapis.com/auth/gmail.readonly"]),
)

# Build the Gmail service
service = build("gmail", "v1", credentials=creds)

# Search for the email with the subject "Broadcast to <ZEALT_RUN_ID>"
subject = f"Broadcast to {ZEALT_RUN_ID}"
query = f"subject:{subject}"

print(f"Searching for email with subject: {subject}")
print(f"Query: {query}")

max_retries = 10
retry_delay = 15  # seconds

for attempt in range(max_retries):
    try:
        results = service.users().messages().list(userId="me", q=query).execute()
        messages = results.get("messages", [])

        if messages:
            # Get the first matching message
            msg_id = messages[0]["id"]
            message = service.users().messages().get(userId="me", id=msg_id, format="full").execute()

            # Extract subject from headers
            headers = message["payload"].get("headers", [])
            email_subject = ""
            for header in headers:
                if header["name"].lower() == "subject":
                    email_subject = header["value"]
                    break

            print(f"Found email with subject: {email_subject}")
            print(f"EMAIL_SUBJECT:{email_subject}")
            sys.exit(0)
        else:
            print(f"Attempt {attempt + 1}/{max_retries}: Email not found yet, retrying in {retry_delay}s...")
            time.sleep(retry_delay)
    except Exception as e:
        print(f"Attempt {attempt + 1}/{max_retries}: Error: {e}")
        time.sleep(retry_delay)

print("ERROR: Could not find the email after maximum retries.")
sys.exit(1)