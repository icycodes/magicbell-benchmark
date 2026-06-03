import os
import shutil
import pytest

PROJECT_DIR = "/home/user/magicbell-task"

def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_directory_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_magicbell_env_vars_available():
    required_vars = [
        "MAGICBELL_EMAIL",
        "MAGICBELL_API_KEY",
        "MAGICBELL_SECRET_KEY",
        "MAGICBELL_PROJECT_TOKEN"
    ]
    for var in required_vars:
        assert var in os.environ, f"Environment variable {var} is not set."
