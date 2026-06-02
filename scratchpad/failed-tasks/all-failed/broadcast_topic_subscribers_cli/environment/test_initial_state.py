import os
import shutil

PROJECT_DIR = "/home/user/magicbell-task"


def test_magicbell_binary_available():
    assert shutil.which("magicbell") is not None, "magicbell binary not found in PATH."


def test_curl_available():
    assert shutil.which("curl") is not None, "curl binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_required_env_vars():
    for var in (
        "MAGICBELL_EMAIL",
        "MAGICBELL_PROJECT_TOKEN",
        "MAGICBELL_API_KEY",
        "MAGICBELL_SECRET_KEY",
        "ZEALT_RUN_ID",
    ):
        assert var in os.environ, f"{var} environment variable is missing."
        assert os.environ[var].strip() != "", f"{var} is empty."
