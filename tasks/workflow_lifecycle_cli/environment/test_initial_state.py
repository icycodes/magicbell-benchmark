import os
import shutil
import pytest

PROJECT_DIR = "/home/user/myproject"

def test_magicbell_cli_available():
    """Verify that the magicbell CLI is installed and available in PATH."""
    assert shutil.which("magicbell") is not None, "magicbell CLI is not found in PATH."

def test_project_dir_exists():
    """Verify that the project directory exists."""
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_environment_variables_exist():
    """Verify that the required MagicBell and Gmail environment variables are set."""
    required_vars = [
        "MAGICBELL_EMAIL",
        "MAGICBELL_PROJECT_TOKEN",
        "MAGICBELL_API_KEY",
        "MAGICBELL_SECRET_KEY",
        "GMAIL_USER_NAME",
        "GMAIL_TOKEN_JSON"
    ]
    for var in required_vars:
        assert var in os.environ, f"Environment variable {var} is not set."
