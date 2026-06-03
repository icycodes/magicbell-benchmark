import os
import requests
import jwt
import pytest

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file {LOG_FILE} does not exist."
    with open(LOG_FILE, "r") as f:
        content = f.read()
    assert len(content.strip()) > 0, "Log file is empty, expected a success message."

def test_user_preferences_updated():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is missing"

    mb_email = os.environ.get("MAGICBELL_EMAIL")
    assert mb_email, "MAGICBELL_EMAIL environment variable is missing"

    api_key = os.environ.get("MAGICBELL_API_KEY")
    assert api_key, "MAGICBELL_API_KEY environment variable is missing"

    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    assert secret_key, "MAGICBELL_SECRET_KEY environment variable is missing"

    user_email = f"{mb_email}+{run_id}@gmail.com"

    # Generate User JWT
    payload = {
        "user_email": user_email,
        "api_key": api_key,
    }
    user_jwt = jwt.encode(payload, secret_key, algorithm="HS256")

    # Fetch user preferences
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "Accept": "application/json"
    }
    
    url = "https://api.magicbell.com/channels/user_preferences"
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to fetch user preferences: {response.text}"
    
    data = response.json()
    categories = data.get("categories", [])
    
    default_category = next((cat for cat in categories if cat.get("key") == "default"), None)
    assert default_category is not None, "Category with key 'default' not found in user preferences."
    
    channels = default_category.get("channels", [])
    email_channel = next((ch for ch in channels if ch.get("name") == "email"), None)
    assert email_channel is not None, "Channel 'email' not found under 'default' category."
    
    assert email_channel.get("enabled") is False, "Email channel under 'default' category is not disabled (enabled is not false)."
