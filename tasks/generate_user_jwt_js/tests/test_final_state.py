import os
import jwt
import pytest

PROJECT_DIR = "/home/user/myproject"
JWT_FILE = os.path.join(PROJECT_DIR, "user_jwt.txt")
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

def get_run_id():
    return os.environ.get("ZEALT_RUN_ID", "").strip()

def test_files_exist():
    """Verify that user_jwt.txt and output.log exist."""
    assert os.path.isfile(JWT_FILE), f"Token file not found at {JWT_FILE}"
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"

def test_jwt_contents_and_signature():
    """Verify that the generated JWT is correctly formatted, contains correct payload, and is signed with the correct secret."""
    assert os.path.isfile(JWT_FILE), f"Token file not found at {JWT_FILE}"
    
    with open(JWT_FILE, "r") as f:
        token = f.read().strip()
        
    assert token, "The generated JWT token file is empty."
    
    # Retrieve secrets from env
    secret = os.environ.get("MAGICBELL_SECRET_KEY")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    run_id = get_run_id()
    
    assert secret, "MAGICBELL_SECRET_KEY environment variable is not set."
    assert api_key, "MAGICBELL_API_KEY environment variable is not set."
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    # Decode and verify token signature and algorithm
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        # It's okay if it expired during verification, but we can decode without verification to check contents
        payload = jwt.decode(token, options={"verify_signature": False})
    except jwt.InvalidSignatureError as e:
        pytest.fail(f"JWT signature verification failed: {e}")
    except Exception as e:
        pytest.fail(f"Failed to decode or verify JWT: {e}")
        
    # Verify header algorithm
    header = jwt.get_unverified_header(token)
    assert header.get("alg") == "HS256", f"Expected algorithm HS256, got {header.get('alg')}"
    
    # Verify payload contents
    expected_email = f"user-{run_id}@gmail.com"
    expected_external_id = f"ext-{run_id}"
    
    assert payload.get("user_email") == expected_email, \
        f"Expected user_email '{expected_email}', got '{payload.get('user_email')}'"
    assert payload.get("user_external_id") == expected_external_id, \
        f"Expected user_external_id '{expected_external_id}', got '{payload.get('user_external_id')}'"
    assert payload.get("api_key") == api_key, \
        f"Expected api_key '{api_key}', got '{payload.get('api_key')}'"

def test_output_log():
    """Verify the output.log contents."""
    assert os.path.isfile(LOG_FILE), f"Log file not found at {LOG_FILE}"
    assert os.path.isfile(JWT_FILE), f"Token file not found at {JWT_FILE}"
    
    with open(JWT_FILE, "r") as f:
        token = f.read().strip()
        
    with open(LOG_FILE, "r") as f:
        log_content = f.read()
        
    assert f"User JWT: {token}" in log_content, \
        f"Expected log to contain 'User JWT: {token}', got:\n{log_content}"
        
    assert "API Status: Success" in log_content, \
        f"Expected log to contain 'API Status: Success', got:\n{log_content}"
