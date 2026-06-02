import os
import requests
project_token = os.environ.get('MAGICBELL_PROJECT_TOKEN', '')
url = "https://api.magicbell.com/users"
headers = {
    "Authorization": f"Bearer {project_token}",
    "Content-Type": "application/json"
}
payload = {
    "user": {
        "external_id": "test-v1",
        "email": "test-v1@example.com"
    }
}
response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
