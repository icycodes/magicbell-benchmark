import os
import shutil

PROJECT_DIR = "/home/user/magicbell-go-list-workflows"

def test_go_binary_available():
    assert shutil.which("go") is not None, "go binary not found in PATH."

def test_magicbell_cli_available():
    assert shutil.which("magicbell") is not None, "magicbell CLI not found in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."
