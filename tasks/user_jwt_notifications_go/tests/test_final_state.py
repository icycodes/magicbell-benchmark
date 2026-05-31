import os
import re
import jwt
import pytest

LOG_FILE = "/home/user/myproject/output.log"

def test_log_file_exists():
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"

def test_log_content():
    # Read the environment variables
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    gmail_username = os.environ.get("GMAIL_USER_NAME")
    run_id = os.environ.get("ZEALT_RUN_ID")

    assert secret_key, "MAGICBELL_SECRET_KEY environment variable is not set."
    assert api_key, "MAGICBELL_API_KEY environment variable is not set."
    assert gmail_username, "GMAIL_USER_NAME environment variable is not set."
    assert run_id, "ZEALT_RUN_ID environment variable is not set."

    # Expected values
    expected_email = f"{gmail_username}+{run_id}@gmail.com"
    expected_external_id = f"user_{run_id}"
    expected_title = f"Notification {run_id}"

    with open(LOG_FILE, "r") as f:
        content = f.read()

    # Parse User JWT
    jwt_match = re.search(r"User JWT:\s*(\S+)", content)
    assert jwt_match, "Could not find 'User JWT: <jwt>' in the log file."
    user_jwt = jwt_match.group(1)

    # Parse Notifications Count
    count_match = re.search(r"Notifications Count:\s*(\d+)", content)
    assert count_match, "Could not find 'Notifications Count: <count>' in the log file."
    count = int(count_match.group(1))
    assert count >= 1, f"Expected Notifications Count to be at least 1, got {count}."

    # Parse Latest Notification Title
    title_match = re.search(r"Latest Notification Title:\s*(.+)", content)
    assert title_match, "Could not find 'Latest Notification Title: <title>' in the log file."
    actual_title = title_match.group(1).strip()
    assert actual_title == expected_title, f"Expected Latest Notification Title to be '{expected_title}', got '{actual_title}'."

    # Verify and decode JWT
    try:
        decoded = jwt.decode(user_jwt, secret_key, algorithms=["HS256"])
    except jwt.PyJWTError as e:
        pytest.fail(f"Failed to decode or verify User JWT: {e}")

    # Verify JWT payload
    assert decoded.get("user_email") == expected_email, \
        f"JWT user_email mismatch. Expected '{expected_email}', got '{decoded.get('user_email')}'"
    assert decoded.get("user_external_id") == expected_external_id, \
        f"JWT user_external_id mismatch. Expected '{expected_external_id}', got '{decoded.get('user_external_id')}'"
    assert decoded.get("api_key") == api_key, \
        f"JWT api_key mismatch. Expected '{api_key}', got '{decoded.get('api_key')}'"
