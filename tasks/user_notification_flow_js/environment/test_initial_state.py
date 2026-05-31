import os
import shutil

def test_node_and_npm_available():
    assert shutil.which("node") is not None, "Node.js binary not found in PATH."
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_environment_variables_set():
    required_vars = [
        "MAGICBELL_API_KEY",
        "MAGICBELL_SECRET_KEY",
        "MAGICBELL_PROJECT_TOKEN",
        "GMAIL_USER_NAME",
        "ZEALT_RUN_ID"
    ]
    for var in required_vars:
        assert os.environ.get(var) is not None, f"Environment variable {var} must be set."

def test_initial_files_do_not_exist():
    project_dir = "/home/user/magicbell-flow"
    jwt_file = os.path.join(project_dir, "user_jwt.txt")
    log_file = os.path.join(project_dir, "flow.log")
    
    if os.path.exists(project_dir):
        assert not os.path.exists(jwt_file), f"Initial state error: {jwt_file} should not exist yet."
        assert not os.path.exists(log_file), f"Initial state error: {log_file} should not exist yet."
