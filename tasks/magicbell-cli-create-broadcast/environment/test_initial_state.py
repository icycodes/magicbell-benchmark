import os
import shutil
import pytest

PROJECT_DIR = "/home/user/myproject"

def test_magicbell_cli_available():
    assert shutil.which("magicbell") is not None, "magicbell binary not found in PATH."

def test_project_directory_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."