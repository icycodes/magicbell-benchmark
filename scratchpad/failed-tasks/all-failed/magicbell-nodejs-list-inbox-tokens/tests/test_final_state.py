import os
import json
import requests
import pytest

PROJECT_DIR = "/home/user/magicbell-nodejs-list-inbox-tokens"
OUTPUT_FILE = os.path.join(PROJECT_DIR, "output.json")

def test_output_file_exists_and_is_array():
    assert os.path.isfile(OUTPUT_FILE), f"Output file not found at {OUTPUT_FILE}"
    with open(OUTPUT_FILE, "r") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            pytest.fail("Output file does not contain valid JSON")
    
    assert isinstance(data, list), f"Expected output to be a JSON array, got {type(data).__name__}"

def test_output_matches_api():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set"
    
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    assert magicbell_email, "MAGICBELL_EMAIL environment variable is not set"
    
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    assert project_token, "MAGICBELL_PROJECT_TOKEN environment variable is not set"

    user_email = f"{magicbell_email}+list-tokens-{run_id}@gmail.com"
    
    # Check what the API returns
    api_url = f"https://api.magicbell.com/users/{user_email}/channels/in_app/inbox/tokens"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(api_url, headers=headers)
    assert response.status_code in [200, 404], f"Failed to fetch tokens from API: {response.text}"
    
    if response.status_code == 404:
        # If user doesn't exist, they have no tokens
        api_tokens = []
    else:
        api_data = response.json()
        api_tokens = api_data.get("inbox_tokens", [])
        # Wait, the response format is InboxTokenResponseCollection, probably has "inbox_tokens" or "data" array.
        # Let's just compare lengths, assuming output.json is mapped correctly.
        # Wait, the JS SDK returns `{ data: [...] }`. Wait, if the response has `inbox_tokens` key, we use that.
        # Wait, usually MagicBell API returns `{ "inbox_tokens": [...] }` or `{ "data": [...] }`.
        # Let's check `api_data`.
        if "inbox_tokens" in api_data:
            api_tokens = api_data["inbox_tokens"]
        elif "data" in api_data:
            api_tokens = api_data["data"]
        else:
            api_tokens = []

    with open(OUTPUT_FILE, "r") as f:
        local_data = json.load(f)
    
    assert len(local_data) == len(api_tokens), f"Expected {len(api_tokens)} tokens, but found {len(local_data)} in output.json"
