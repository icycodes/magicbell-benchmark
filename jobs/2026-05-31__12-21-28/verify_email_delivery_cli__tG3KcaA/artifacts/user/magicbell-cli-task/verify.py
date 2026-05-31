import json
import os
import time
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

run_id = os.environ.get('ZEALT_RUN_ID')
expected_subject = f"Broadcast to {run_id}"

creds_info = json.loads(os.environ['GMAIL_TOKEN_JSON'])
creds = Credentials.from_authorized_user_info(creds_info)
service = build('gmail', 'v1', credentials=creds)

found_subject = None

for i in range(10):
    results = service.users().messages().list(userId='me', q=f"subject:\"{expected_subject}\"").execute()
    messages = results.get('messages', [])
    
    if messages:
        msg = service.users().messages().get(userId='me', id=messages[0]['id'], format='metadata', metadataHeaders=['Subject']).execute()
        headers = msg.get('payload', {}).get('headers', [])
        for h in headers:
            if h['name'] == 'Subject':
                found_subject = h['value']
                break
        if found_subject:
            break
    print("Waiting for email...")
    time.sleep(5)

if found_subject:
    print(f"FOUND:{found_subject}")
else:
    print("NOT FOUND")
