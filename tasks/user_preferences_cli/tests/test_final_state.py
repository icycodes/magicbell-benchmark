import os
import json
import requests
import jwt
import pytest

PROJECT_DIR = "/home/user/myproject"
LOG_FILE = os.path.join(PROJECT_DIR, "preferences.json")

def test_preferences_log_file_exists():
    """Verify that the preferences log file exists."""
    assert os.path.isfile(LOG_FILE), f"Expected log file {LOG_FILE} does not exist."

def test_preferences_log_file_content():
    """Verify that the log file contains valid JSON and the correct preferences."""
    with open(LOG_FILE, "r") as f:
        data = json.load(f)
    
    # Depending on CLI output, it might be nested under 'notification_preferences' or 'categories'
    # Let's inspect categories
    categories = []
    if isinstance(data, dict):
        if "notification_preferences" in data:
            categories = data["notification_preferences"].get("categories", [])
        elif "categories" in data:
            categories = data["categories"]
    elif isinstance(data, list):
        categories = data
        
    assert len(categories) > 0, f"No categories found in the log file content: {data}"
    
    # Find billing category
    billing_category = None
    for cat in categories:
        if cat.get("slug") == "billing":
            billing_category = cat
            break
            
    assert billing_category is not None, "Billing category not found in logged preferences."
    
    # Find email channel in billing category
    email_channel = None
    for chan in billing_category.get("channels", []):
        if chan.get("slug") == "email":
            email_channel = chan
            break
            
    assert email_channel is not None, "Email channel not found in billing category."
    assert email_channel.get("enabled") is False, "Expected email channel to be disabled for billing category in log file."

def test_magicbell_server_preferences():
    """Verify that the preferences are updated on the real MagicBell server."""
    run_id = os.environ.get("ZEALT_RUN_ID")
    gmail_user = os.environ.get("GMAIL_USER_NAME")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    assert gmail_user, "GMAIL_USER_NAME environment variable is not set."
    assert api_key, "MAGICBELL_API_KEY environment variable is not set."
    assert secret_key, "MAGICBELL_SECRET_KEY environment variable is not set."
    
    user_email = f"{gmail_user}+user-{run_id}@gmail.com"
    user_external_id = f"user-{run_id}"
    
    # Generate User JWT
    user_jwt = jwt.encode(
        {
            "user_email": user_email,
            "user_external_id": user_external_id,
            "api_key": api_key,
        },
        secret_key,
        algorithm="HS256"
    )
    
    # Fetch from MagicBell API
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "X-MAGICBELL-API-KEY": api_key,
        "Accept": "application/json",
    }
    
    # Try both v1 and v2 endpoints if needed, but v1 is standard for notification_preferences
    url = "https://api.magicbell.com/v1/notification_preferences"
    response = requests.get(url, headers=headers)
    
    assert response.status_code == 200, f"Failed to fetch preferences from MagicBell API: {response.text}"
    
    res_data = response.json()
    categories = []
    if "notification_preferences" in res_data:
        categories = res_data["notification_preferences"].get("categories", [])
    elif "categories" in res_data:
        categories = res_data["categories"]
        
    billing_category = None
    for cat in categories:
        if cat.get("slug") == "billing":
            billing_category = cat
            break
            
    assert billing_category is not None, "Billing category not found on MagicBell server preferences."
    
    email_channel = None
    for chan in billing_category.get("channels", []):
        if chan.get("slug") == "email":
            email_channel = chan
            break
            
    assert email_channel is not None, "Email channel not found in billing category on MagicBell server."
    assert email_channel.get("enabled") is False, "Email channel is not disabled on the real MagicBell server."
