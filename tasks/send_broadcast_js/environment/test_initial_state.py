import os
import shutil

def test_node_and_npm_available():
    assert shutil.which("node") is not None, "Node.js binary not found in PATH."
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_required_env_vars():
    assert "MAGICBELL_PROJECT_TOKEN" in os.environ, "MAGICBELL_PROJECT_TOKEN environment variable is missing."
    assert os.environ["MAGICBELL_PROJECT_TOKEN"].strip() != "", "MAGICBELL_PROJECT_TOKEN is empty."
    
    assert "GMAIL_USER_NAME" in os.environ, "GMAIL_USER_NAME environment variable is missing."
    assert os.environ["GMAIL_USER_NAME"].strip() != "", "GMAIL_USER_NAME is empty."
    
    assert "ZEALT_RUN_ID" in os.environ, "ZEALT_RUN_ID environment variable is missing."
    assert os.environ["ZEALT_RUN_ID"].strip() != "", "ZEALT_RUN_ID is empty."
