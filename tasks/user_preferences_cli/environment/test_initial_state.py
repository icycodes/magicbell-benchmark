import os
import shutil

PROJECT_DIR = "/home/user/myproject"

def test_magicbell_cli_available():
    assert shutil.which("magicbell") is not None, "magicbell CLI binary not found in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."
