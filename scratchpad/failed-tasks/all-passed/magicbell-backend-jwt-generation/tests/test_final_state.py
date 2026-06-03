import os
import subprocess
import re
import pytest
import jwt

PROJECT_DIR = "/home/user/myproject"

def test_jwt_generation_and_verification():
    # Run the script
    result = subprocess.run(
        ["node", "generate_jwt.js"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    
    assert result.returncode == 0, f"Script execution failed: {result.stderr}"
    
    # Extract the token
    match = re.search(r"User JWT:\s*([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+)", result.stdout)
    assert match is not None, f"Could not find 'User JWT: <token>' in output. Output was: {result.stdout}"
    
    token = match.group(1)
    
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    email = os.environ.get("MAGICBELL_EMAIL")
    run_id = os.environ.get("ZEALT_RUN_ID")
    
    assert secret_key, "MAGICBELL_SECRET_KEY environment variable is not set."
    assert api_key, "MAGICBELL_API_KEY environment variable is not set."
    assert email, "MAGICBELL_EMAIL environment variable is not set."
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    expected_email = f"{email}+{run_id}@gmail.com"
    expected_external_id = f"user_{run_id}"
    
    try:
        # Decode and verify token
        decoded = jwt.decode(token, secret_key, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        pytest.fail("Token has expired.")
    except jwt.InvalidTokenError as e:
        pytest.fail(f"Invalid token: {e}")
        
    assert decoded.get("user_email") == expected_email, f"Expected user_email '{expected_email}', got '{decoded.get('user_email')}'"
    assert decoded.get("user_external_id") == expected_external_id, f"Expected user_external_id '{expected_external_id}', got '{decoded.get('user_external_id')}'"
    assert decoded.get("api_key") == api_key, f"Expected api_key '{api_key}', got '{decoded.get('api_key')}'"
    
    assert "exp" in decoded, "Token does not have an expiration time ('exp' claim missing)."
