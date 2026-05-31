import os
import shutil
import pytest

PROJECT_DIR = "/home/user/magicbell-cli-task"

def test_magicbell_cli_installed():
    assert shutil.which("magicbell") is not None, "magicbell CLI is not installed or not in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."
